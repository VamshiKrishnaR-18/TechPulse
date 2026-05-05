import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

const SECRET_KEY = process.env.JWT_SECRET || "techpulse_secret";

export const signup = async (req, res, next) => {
  const { email, password, interestedTags = [], contentPreferences = [] } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const isFirstUser = (await prisma.user.count()) === 0;
    const user = await prisma.user.create({
      data: { 
        email, 
        password: hashedPassword, 
        role: isFirstUser ? "ADMIN" : "USER",
        interestedTags,
        contentPreferences,
        interests: interestedTags // Fallback for existing logic
      },
    });
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      SECRET_KEY,
    );
    res.cookie("tp_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({ 
      success: true, 
      token, 
      user: { 
        id: user.id,
        email: user.email, 
        role: user.role,
        interestedTags: user.interestedTags,
        contentPreferences: user.contentPreferences,
        mutedTags: user.mutedTags,
        minRelevance: user.minRelevance
      } 
    });
  } catch (e) {
    console.error("Signup Error Details:", e.message, e.stack);
    // If it's a Prisma unique constraint error, return 400
    if (e.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: "User already exists.",
      });
    }
    // For other errors, pass to global error handler
    next(e);
  }
};

export const login = async (req, res, next) => {
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
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ 
        success: true, 
        token, 
        user: { 
          id: user.id,
          email: user.email, 
          role: user.role,
          interestedTags: user.interestedTags,
          contentPreferences: user.contentPreferences,
          mutedTags: user.mutedTags,
          minRelevance: user.minRelevance
        } 
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials." });
    }
  } catch (e) {
    console.error("Login Error Details:", e.message, e.stack);
    next(e);
  }
};
