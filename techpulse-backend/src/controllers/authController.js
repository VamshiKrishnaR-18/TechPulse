import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

const SECRET_KEY = process.env.JWT_SECRET || "techpulse_secret";

export const signup = async (req, res) => {
  const { email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const isFirstUser = (await prisma.user.count()) === 0;
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, role: isFirstUser ? "ADMIN" : "USER" },
    });
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role, // 
      },
      SECRET_KEY,
    );
    res.cookie("tp_token", token, {
      httpOnly: true, // Prevents JavaScript from reading the cookie (XSS protection)
      secure: process.env.NODE_ENV === "production", // Only sends over HTTPS in production
      sameSite: "lax", // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
    res.status(201).json({ success: true, token, user: { email: user.email, role: user.role } });
  } catch (e) {
    console.error("Signup Error Details:", e.message, e.stack);
    res.status(400).json({
      success: false,
      message: "User already exists or signup failed.",
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role, // 
        },
        SECRET_KEY,
      );
      res.cookie("tp_token", token, {
        httpOnly: true, // Prevents JavaScript from reading the cookie (XSS protection)
        secure: process.env.NODE_ENV === "production", // Only sends over HTTPS in production
        sameSite: "lax", // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      });
      res.json({ success: true, token, user: { email: user.email, role: user.role } });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials." });
    }
  } catch (e) {
    console.error("Login Error Details:", e.message, e.stack);
    res.status(500).json({ success: false, message: "Login failed." });
  }
};
