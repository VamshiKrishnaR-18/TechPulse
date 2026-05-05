import { Server } from 'socket.io';
import logger from './logger.js';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                process.env.FRONTEND_URL, 
                'http://localhost:5173', 
                'https://tech-pulse-pi.vercel.app'
            ].filter(Boolean),
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        logger.info(`🔌 Client connected: ${socket.id}`);

        socket.on('disconnect', () => {
            logger.info(`🔌 Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

export const emitNewArticle = (article) => {
    if (io) {
        io.emit('new_article', article);
        logger.info(`📡 Emitted new article via socket: ${article.cleanTitle || article.title}`);
    }
};
