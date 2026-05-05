import { Webhook } from 'svix';
import prisma from '../config/prisma.js';
import logger from '../config/logger.js';

/**
 * Handles Clerk Webhooks to sync user data.
 */
export const handleClerkWebhook = async (req, res) => {
    const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!CLERK_WEBHOOK_SECRET) {
        logger.error("❌ Missing CLERK_WEBHOOK_SECRET in environment variables.");
        return res.status(500).json({ success: false, message: "Webhook secret not configured." });
    }

    // Get the headers and body
    const headers = req.headers;
    const payload = JSON.stringify(req.body);

    // Get the Svix headers for verification
    const svix_id = headers["svix-id"];
    const svix_timestamp = headers["svix-timestamp"];
    const svix_signature = headers["svix-signature"];

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).json({ success: false, message: "Missing svix headers." });
    }

    // Create a new Svix instance with your secret.
    const wh = new Webhook(CLERK_WEBHOOK_SECRET);

    let evt;

    // Verify the payload with the headers
    try {
        evt = wh.verify(payload, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch (err) {
        logger.error("❌ Clerk Webhook verification failed:", err.message);
        return res.status(400).json({ success: false, message: "Verification failed." });
    }

    // Handle the event
    const { id } = evt.data;
    const eventType = evt.type;

    logger.info(`📡 Clerk Webhook received: ${eventType} (ID: ${id})`);

    if (eventType === "user.created") {
        const { id: clerkId, email_addresses, first_name, last_name, public_metadata } = evt.data;
        const email = email_addresses[0]?.email_address;
        const name = first_name && last_name ? `${first_name} ${last_name}` : first_name || null;

        try {
            const user = await prisma.user.upsert({
                where: { clerkId },
                update: {
                    email,
                    name,
                    interests: public_metadata?.interests || [],
                    interestedTags: public_metadata?.interestedTags || [],
                },
                create: {
                    clerkId,
                    email,
                    name,
                    interests: public_metadata?.interests || [],
                    interestedTags: public_metadata?.interestedTags || [],
                }
            });
            logger.info(`✅ User synced from Clerk: ${user.email}`);
        } catch (error) {
            logger.error(`❌ Error syncing user from Clerk: ${error.message}`);
            return res.status(500).json({ success: false });
        }
    }

    if (eventType === "user.updated") {
        const { id: clerkId, email_addresses, first_name, last_name, public_metadata } = evt.data;
        const email = email_addresses[0]?.email_address;
        const name = `${first_name} ${last_name}`;

        try {
            await prisma.user.update({
                where: { clerkId },
                data: {
                    email,
                    name,
                    interests: public_metadata?.interests || [],
                    interestedTags: public_metadata?.interestedTags || [],
                }
            });
            logger.info(`✅ User updated from Clerk: ${clerkId}`);
        } catch (error) {
            logger.error(`❌ Error updating user from Clerk: ${error.message}`);
            return res.status(500).json({ success: false });
        }
    }

    if (eventType === "user.deleted") {
        try {
            await prisma.user.delete({
                where: { clerkId: id }
            });
            logger.info(`🗑️ User deleted from Clerk: ${id}`);
        } catch (error) {
            logger.error(`❌ Error deleting user from Clerk: ${error.message}`);
            return res.status(500).json({ success: false });
        }
    }

    return res.json({ success: true });
};