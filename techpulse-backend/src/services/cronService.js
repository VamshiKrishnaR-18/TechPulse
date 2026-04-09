import cron from 'node-cron';
import prisma from '../config/prisma.js';

export const initCronJobs = () => {
    cron.schedule('* * * * *', async () => {
        try {
            const allRecords = await prisma.techAnalysis.findMany();
            for (const record of allRecords) {
                await prisma.techAnalysis.update({ 
                    where: { id: record.id }, 
                    data: { createdAt: new Date() } 
                });
            }
        } catch (error) { 
            console.error("Worker Error:", error.message); 
        }
    });
};
