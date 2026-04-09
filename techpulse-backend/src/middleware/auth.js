import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || "techpulse_secret";

export const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1] || req.query.token || req.body.token;

    if (!token) return res.status(401).json({ success: false, message: "No token provided." });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }
};
