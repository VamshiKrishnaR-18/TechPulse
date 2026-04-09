import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

const SECRET_KEY = process.env.JWT_SECRET || "techpulse_secret";

export const signup = async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword }
        });
        const token = jwt.sign({ userId: user.id }, SECRET_KEY);
        res.json({ success: true, token, user: { email: user.email } });
    } catch (e) {
        res.status(400).json({ success: false, message: "User already exists or signup failed." });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ userId: user.id }, SECRET_KEY);
            res.json({ success: true, token, user: { email: user.email } });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials." });
        }
    } catch (e) {
        res.status(500).json({ success: false, message: "Login failed." });
    }
};
