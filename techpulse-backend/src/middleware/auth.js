import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || "techpulse_secret";

export const authenticateToken = (req, res, next) => {
    const token = req.cookies.tp_token || req.headers['authorization']?.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: "No token provided." });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired token." });
    }
};

// Middleware to protect admin-only routes
export const requireAdmin = (req, res, next) => {
    // req.user is attached by authenticateToken middleware
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: "Forbidden: Super User access required." 
        });
    }
    next();
};
