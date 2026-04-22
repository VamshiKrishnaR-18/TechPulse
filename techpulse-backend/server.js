import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet'; // 🛡️ NEW: HTTP Header Security
import rateLimit from 'express-rate-limit'; // 🚦 NEW: Traffic Control
import morgan from 'morgan';

import router from './src/routes/index.js';
import { initCronJobs } from './src/services/cronService.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import logger from './src/config/logger.js';
import { setupSwagger } from './src/config/swagger.js';

dotenv.config();

const app = express();

// ==========================================
// 0. TRUST PROXY (Production Requirement)
// ==========================================
// When deploying to cloud platforms (Render, AWS, Heroku, etc.), 
// traffic passes through a load balancer/proxy. This ensures 
// express-rate-limit correctly identifies the client's real IP.
app.set('trust proxy', 1);

// ==========================================
// 1. HTTP HEADER PROTECTION (HELMET)
// ==========================================
// Automatically hides the "X-Powered-By: Express" header and sets strict 
// content security policies to prevent Cross-Site Scripting (XSS) attacks.
app.use(helmet());

// ==========================================
// 2. STRICT CORS CONFIGURATION
// ==========================================
// Instead of letting anyone hit your API, we explicitly whitelist your Vite frontend.
const corsOptions = {
    origin: [
        process.env.FRONTEND_URL, 
        'http://localhost:5173', 
        'https://tech-pulse-pi.vercel.app'
    ].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
};
app.use(cors(corsOptions));

// ==========================================
// 3. RATE LIMITING (DDoS & Bot Protection)
// ==========================================
// Limits each IP address to 100 requests per 15-minute window.
// This prevents a malicious bot from spamming your Gemini API and running up a massive bill.
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { success: false, message: 'Too many requests from this IP. Please try again in 15 minutes.' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiter to all API requests
app.use('/api', limiter); 

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Swagger Documentation
setupSwagger(app);

// Routes
app.use(router);

// Catch all unknown routes and return a clean JSON 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found. Please check the URL and HTTP method.'
    });
});

// Global Error Handling
app.use(errorHandler);



const PORT = process.env.PORT || 5000;

// Only listen on the port if we are NOT running tests
if (process.env.NODE_ENV !== 'test') {

    initCronJobs();
    app.listen(PORT, () => {
        logger.info(`🚀 Secure TechPulse Orchestrator running on http://localhost:${PORT}`);
    });
}

// Export the app so Supertest can use it
export { app };