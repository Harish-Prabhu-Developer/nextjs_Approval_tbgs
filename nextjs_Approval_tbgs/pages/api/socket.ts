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
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log('*First use, starting socket.io');

    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);

      socket.on('join', async (userIdParam: any) => {
        const userId = Number(userIdParam);
        if (isNaN(userId)) return;

        socket.data.userId = userId;
        socket.join(`user-${userId}`); // Join personal room
        console.log(`User ${userId} joined room user-${userId}`);
        
        // Update user status in DB
        try {
            await db.insert(userStatus).values({
                userId,
                isOnline: true,
                lastSeen: new Date()
            }).onConflictDoUpdate({
                target: userStatus.userId,
                set: { isOnline: true, lastSeen: new Date() }
            });
            
            // Broadcast status update to everyone
            io.emit('status-update', { userId, isOnline: true });
        } catch (err) {
            console.error("Error updating user status:", err);
        }
      });

      socket.on('send-message', (data) => {
        // Target receiver and sender securely via rooms
        const receiverRoom = `user-${Number(data.receiverId)}`;
        const senderRoom = `user-${Number(data.senderId)}`;
        
        io.to(receiverRoom).to(senderRoom).emit('new-message', data);
      });

      socket.on('typing', ({ receiverId, typing, userId }) => {
        const targetRoom = `user-${Number(receiverId)}`;
        io.to(targetRoom).emit('user-typing', { userId, typing });

        // Server-side safety: auto-clear typing after 5s in case client goes silent
        if (typing) {
            const key = `typing_${socket.id}_${receiverId}`;
            if ((socket as any)._typingTimers?.[key]) {
                clearTimeout((socket as any)._typingTimers[key]);
            }
            if (!(socket as any)._typingTimers) (socket as any)._typingTimers = {};
            (socket as any)._typingTimers[key] = setTimeout(() => {
                io.to(targetRoom).emit('user-typing', { userId, typing: false });
            }, 5000);
        }
      });

      socket.on('messages-read', ({ senderId, receiverId }) => {
        const sId = Number(senderId);
        const rId = Number(receiverId);
        
        // Notify both parties (Sender to update ticks, Receiver to sync other tabs)
        io.to(`user-${sId}`).to(`user-${rId}`).emit('on-messages-read', { 
            senderId: sId, 
            receiverId: rId 
        });
      });

      socket.on('delete-message', ({ messageId, receiverId }) => {
        const targetRoom = `user-${Number(receiverId)}`;
        io.to(targetRoom).emit('message-deleted', { messageId });
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
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};

export default ioHandler;
