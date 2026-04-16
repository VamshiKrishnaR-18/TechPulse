import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
    throw new Error("JWT_SECRET not defined in environment");
}

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    const token =
        req.cookies?.tp_token ||
        (authHeader && authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : null);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No token provided."
        });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        console.log("Auth error:", error.message);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};

export const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admin privileges required."
        });
    }
    next();
};