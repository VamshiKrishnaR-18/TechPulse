import { AppError } from './errorHandler.js';
import { ZodError } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  } catch (error) {
    // 🛡️ Handle Zod Validation Errors
    if (error instanceof ZodError) {
      const message = error.issues.map(err => err.message).join(', ');
      return next(new AppError(message, 400));
    }
    // For other unexpected errors, pass to global handler
    next(error);
  }
};
