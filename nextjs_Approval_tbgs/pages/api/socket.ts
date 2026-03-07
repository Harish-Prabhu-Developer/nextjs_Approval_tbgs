import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import { NextApiResponseServerIO } from '@/types/socket';
import { db } from '@/db';
import { userStatus } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true, // Recommended for Socket.IO in Next.js
  },
};

// Global for development to prevent multiple IO instances on HMR
const globalForIo = global as unknown as {
  io: ServerIO | undefined;
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log('Socket: Initializing new Socket.IO server...');

    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      pingTimeout: 120000,   // High timeout for slow dev server
      pingInterval: 25000,
      cors: { origin: '*', methods: ['GET', 'POST'] },
    });

    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);

      socket.on('join', async (userIdParam: any) => {
        const userId = Number(userIdParam?.userId || userIdParam); // Support both formats
        if (isNaN(userId)) return;

        socket.data.userId = userId;
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined room user-${userId}`);
        
        try {
            await db.insert(userStatus).values({
                userId,
                isOnline: true,
                lastSeen: new Date()
            }).onConflictDoUpdate({
                target: userStatus.userId,
                set: { isOnline: true, lastSeen: new Date() }
            });
            
            io.emit('status-update', { userId, isOnline: true });
        } catch (err) {
            console.error("Error updating user status:", err);
        }
      });

      socket.on('send-message', (data) => {
        const rId = Number(data.receiverId);
        const sId = Number(data.senderId);
        io.to(`user-${rId}`).to(`user-${sId}`).emit('new-message', data);
      });

      socket.on('typing', ({ receiverId, typing, userId }) => {
        const targetRoom = `user-${Number(receiverId)}`;
        io.to(targetRoom).emit('user-typing', { userId, typing });

        // Auto-clear helper
        if (typing) {
            const key = `typing_${socket.id}_${receiverId}`;
            const typingTimers = (socket as any)._typingTimers || {};
            if (typingTimers[key]) clearTimeout(typingTimers[key]);
            
            typingTimers[key] = setTimeout(() => {
                io.to(targetRoom).emit('user-typing', { userId, typing: false });
                delete typingTimers[key];
            }, 5000);
            (socket as any)._typingTimers = typingTimers;
        }
      });

      socket.on('messages-read', ({ senderId, receiverId }) => {
        const sId = Number(senderId);
        const rId = Number(receiverId);
        io.to(`user-${sId}`).to(`user-${rId}`).emit('on-messages-read', { senderId: sId, receiverId: rId });
      });

      socket.on('delete-message', ({ messageId, receiverId }) => {
        io.to(`user-${Number(receiverId)}`).emit('message-deleted', { messageId });
      });

      socket.on('disconnect', async () => {
        const userId = socket.data.userId;
        if (userId) {
          console.log(`User ${userId} disconnected`);
          try {
            await db.update(userStatus)
                .set({ isOnline: false, lastSeen: new Date() })
                .where(eq(userStatus.userId, userId));
            io.emit('status-update', { userId, isOnline: false });
          } catch (err) {
            console.error("Error updating disconnect status:", err);
          }
        }
        
        // Clean up typing timers
        const typingTimers = (socket as any)._typingTimers;
        if (typingTimers) {
            Object.values(typingTimers).forEach((t: any) => clearTimeout(t));
        }
      });
    });

    res.socket.server.io = io;
    globalForIo.io = io;
  }
  res.end();
};

export default ioHandler;
