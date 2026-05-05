import express from 'express';
import { handleClerkWebhook } from '../controllers/clerkWebhookController.js';
import bodyParser from 'body-parser';

const router = express.Router();

// Webhook needs raw body for verification
router.post('/clerk', bodyParser.raw({ type: 'application/json' }), handleClerkWebhook);

export default router;