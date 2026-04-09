import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import router from './src/routes/index.js';
import { initCronJobs } from './src/services/cronService.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import logger from './src/config/logger.js';
import { setupSwagger } from './src/config/swagger.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Swagger Documentation
setupSwagger(app);

// Routes
app.use(router);

// Global Error Handling
app.use(errorHandler);

// Start Cron
initCronJobs();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`🚀 TechPulse Orchestrator running on http://localhost:${PORT}`);
});
