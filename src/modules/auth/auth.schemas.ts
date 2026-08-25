import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  birthDate: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).default('female'),
  heightCm: z.number().positive().optional(),
  weightKg: z.number().positive().optional(),
});


export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;