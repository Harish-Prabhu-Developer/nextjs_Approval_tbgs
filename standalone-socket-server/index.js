// standalone-socket-server/index.js
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { networkInterfaces } from 'os';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
const server = http.createServer(app);

// Trust proxy for platforms like Render/Railway/Cloudflare
app.set('trust proxy', 1);

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'online',
        clients: io?.engine?.clientsCount || 0,
        uptime: process.uptime()
    });
});

// CORS configuration for multiple origins
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://192.168.29.216:3000',
    'http://192.168.29.216:3001',
    'https://vit-nextjs.netlify.app',
    ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
];

// Socket.IO Server Configuration with optimized stability
const io = new Server(server, {
    // Connection settings
    pingTimeout: 60000,          // Increased timeout for mobile networks
    pingInterval: 25000,          // Keep-alive interval
    connectTimeout: 45000,         // Connection timeout
    allowEIO3: true,               // Engine.IO v3 compatibility

    // Transport settings - polling first for reliable handshake
    transports: ['polling', 'websocket'],

    // Allow upgrade to websocket after handshake
    allowUpgrades: true,
    upgradeTimeout: 10000,

    // CORS configuration
    cors: {
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps)
            if (!origin) return callback(null, true);

            // Check if origin is allowed
            if (allowedOrigins.some(allowed => origin.includes(allowed))) {
                callback(null, true);
            } else {
                console.warn(`Blocked origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "ngrok-skip-browser-warning",
            "Content-Type",
            "Authorization",
            "X-Requested-With"
        ],
        credentials: true,
        preflightContinue: false,
        optionsSuccessStatus: 204
    },

    // Connection management
    maxHttpBufferSize: 1e6,        // 1MB max message size
    perMessageDeflate: {
        threshold: 1024             // Compress messages > 1KB
    }
});

// Database Connection with retry logic
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20,                        // Maximum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Database connected successfully');
        release();
    }
});

// Store active user connections
const userSockets = new Map(); // userId -> Set of socket ids
const socketUserMap = new Map(); // socketId -> userId

// Socket.IO event handlers
io.on('connection', (socket) => {
    // Get client IP with proxy support
    const clientIp = socket.handshake.headers['x-forwarded-for']
        || socket.handshake.address;

    console.log(`[${new Date().toISOString()}] New Connection: ${socket.id} | IP: ${clientIp} | Transport: ${socket.conn.transport.name}`);

    // Handle transport upgrades
    socket.conn.on('upgrade', (transport) => {
        console.log(`Socket ${socket.id} upgraded to ${transport.name}`);
    });

    // Handle authentication and join
    socket.on('join', async (data) => {
        const userId = Number(data?.userId || data);

        if (isNaN(userId) || userId <= 0) {
            console.log(`Invalid userId: ${data}`);
            socket.emit('error', { message: 'Invalid user ID' });
            return;
        }

        // Store user-socket mapping
        socket.data.userId = userId;
        socket.join(`user-${userId}`);

        // Track user connections
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);
        socketUserMap.set(socket.id, userId);

        console.log(`User ${userId} authenticated and joined. Active users: ${userSockets.size}`);

        try {
            // Update user status in database
            await pool.query(`
                INSERT INTO user_status (user_id, is_online, last_seen)
                VALUES ($1, true, NOW())
                ON CONFLICT (user_id)
                DO UPDATE SET 
                    is_online = true, 
                    last_seen = NOW(),
                    updated_at = NOW()
            `, [userId]);

            // Broadcast online status to all clients
            io.emit('status-update', {
                userId,
                isOnline: true,
                timestamp: new Date().toISOString()
            });

            // Send current online users to the new connection
            const onlineUsers = Array.from(userSockets.keys());
            socket.emit('online-users', onlineUsers);

        } catch (err) {
            console.error("Error updating user status:", err.message);
        }
    });

    // Handle message sending with delivery confirmation
    socket.on('send-message', (data) => {
        const receiverId = Number(data.receiverId);
        const senderId = Number(data.senderId);

        if (!receiverId || !senderId) {
            socket.emit('error', { message: 'Invalid message data' });
            return;
        }

        // Add server timestamp
        const messageData = {
            ...data,
            serverTimestamp: new Date().toISOString(),
            delivered: true
        };

        console.log(`Relaying message from ${senderId} to ${receiverId}`);

        // Send to receiver and sender (for multi-device sync)
        io.to(`user-${receiverId}`).to(`user-${senderId}`).emit('new-message', messageData);

        // Send delivery confirmation to sender
        socket.emit('message-delivered', {
            messageId: data.id,
            receiverId,
            timestamp: new Date().toISOString()
        });
    });

    // Handle typing indicators with auto-clear
    socket.on('typing', ({ receiverId, typing, userId }) => {
        const targetRoom = `user-${Number(receiverId)}`;

        // Clear any existing typing timer for this user
        const typingKey = `typing_${userId}_${receiverId}`;
        if (socket._typingTimers?.[typingKey]) {
            clearTimeout(socket._typingTimers[typingKey]);
        }

        // Send typing status
        io.to(targetRoom).emit('user-typing', {
            userId,
            typing,
            timestamp: new Date().toISOString()
        });

        // Auto-clear typing indicator after 5 seconds
        if (typing) {
            if (!socket._typingTimers) socket._typingTimers = {};

            socket._typingTimers[typingKey] = setTimeout(() => {
                io.to(targetRoom).emit('user-typing', {
                    userId,
                    typing: false,
                    timestamp: new Date().toISOString()
                });
                delete socket._typingTimers[typingKey];
            }, 5000);
        }
    });

    // Handle messages read receipts
    socket.on('messages-read', ({ senderId, receiverId }) => {
        const sId = Number(senderId);
        const rId = Number(receiverId);

        console.log(`Messages read by ${rId} from ${sId}`);

        // Notify both parties (Sender to update ticks, Receiver to sync other devices/tabs)
        io.to(`user-${sId}`).to(`user-${rId}`).emit('on-messages-read', {
            senderId: sId,
            receiverId: rId,
            timestamp: new Date().toISOString()
        });
    });

    // Handle message deletion
    socket.on('delete-message', ({ messageId, receiverId, senderId }) => {
        console.log(`Message ${messageId} deleted by ${senderId}`);

        // Notify receiver and sender
        io.to(`user-${Number(receiverId)}`)
            .to(`user-${Number(senderId)}`)
            .emit('message-deleted', {
                messageId,
                timestamp: new Date().toISOString()
            });
    });

    // Handle ping/pong for connection health check
    socket.on('ping', (callback) => {
        if (typeof callback === 'function') {
            callback({
                pong: true,
                timestamp: Date.now(),
                userId: socket.data.userId
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', async (reason) => {
        const userId = socket.data.userId;
        const socketId = socket.id;

        console.log(`Socket ${socketId} disconnected. Reason: ${reason}`);

        // Remove from tracking maps
        if (userId) {
            const userSocketSet = userSockets.get(userId);
            if (userSocketSet) {
                userSocketSet.delete(socketId);

                // If user has no more active connections, mark as offline
                if (userSocketSet.size === 0) {
                    userSockets.delete(userId);

                    console.log(`User ${userId} fully disconnected (all sockets)`);

                    try {
                        await pool.query(`
                            UPDATE user_status 
                            SET is_online = false, last_seen = NOW() 
                            WHERE user_id = $1
                        `, [userId]);

                        // Broadcast offline status
                        io.emit('status-update', {
                            userId,
                            isOnline: false,
                            timestamp: new Date().toISOString()
                        });
                    } catch (err) {
                        console.error("Error updating disconnect status:", err.message);
                    }
                }
            }
            socketUserMap.delete(socketId);
        }

        // Clear typing timers
        if (socket._typingTimers) {
            Object.values(socket._typingTimers).forEach(t => clearTimeout(t));
        }
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error(`Socket ${socket.id} error:`, error);
    });
});

// Periodic health check to clean up stale connections
setInterval(() => {
    const rooms = io.sockets.adapter.rooms;
    const sids = io.sockets.adapter.sids;

    console.log(`Health check - Active sockets: ${sids.size}, Rooms: ${rooms.size}`);

    // Check for any inconsistencies in tracking maps
    Array.from(socketUserMap.entries()).forEach(([socketId, userId]) => {
        if (!sids.has(socketId)) {
            // Socket no longer exists, clean up
            socketUserMap.delete(socketId);
            const userSet = userSockets.get(userId);
            if (userSet) {
                userSet.delete(socketId);
                if (userSet.size === 0) {
                    userSockets.delete(userId);
                }
            }
        }
    });
}, 30000); // Run every 30 seconds

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[${new Date().toISOString()}] Socket Server Configuration:`);
    console.log(`- Port: ${PORT}`);
    console.log(`- Local: http://localhost:${PORT}`);
    console.log(`- Network: http://${getLocalIp()}:${PORT}`);
    console.log(`- Allowed origins:`, allowedOrigins);
});

// Helper to get local IP
function getLocalIp() {
    const nets = networkInterfaces();

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return '192.168.29.216'; // Default fallback
}