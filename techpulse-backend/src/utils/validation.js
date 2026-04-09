import { z } from 'zod';

export const authSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters')
  })
});

export const summarizeSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title is too short'),
    description: z.string().optional(),
    url: z.string().url('Invalid URL')
  })
});

export const saveArticleSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    url: z.string().url(),
    source: z.string().min(1),
    image: z.string().optional().nullable()
  })
});

export const analysisQuerySchema = z.object({
  query: z.object({
    tech: z.string().min(1, 'Tech name is required')
  })
});

export const saveAnalysisSchema = z.object({
  body: z.object({
    techName: z.string().min(1)
  })
});
