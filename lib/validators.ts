import { z } from 'zod';

export const SignupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const SettingsSchema = z.object({
  displayName: z.string().min(1, 'Display name cannot be empty'),
  defaultInputLanguage: z.string(),
  defaultOutputLanguage: z.string(),
  defaultTone: z.string(),
});

export type SettingsInput = z.infer<typeof SettingsSchema>;

export const CreateDocumentSchema = z.object({
  type: z.enum(['notes', 'letter']),
  title: z.string().min(1),
  inputMode: z.enum(['voice', 'text']),
  transcript: z.string().optional().nullable(),
  inputLanguage: z.string().optional().nullable(),
  outputLanguage: z.string().optional().nullable(),
  letterType: z.string().optional().nullable(),
  tone: z.string().optional().nullable(),
  result: z.any(),
});

export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
