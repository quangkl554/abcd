import { z } from 'zod';

export const regionSchema = z.enum(['nam', 'trung', 'bac']);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createTicketMessageSchema = z.object({
  date: dateSchema,
  region: regionSchema,
  playerId: z.string().uuid().nullable().optional(),
  text: z.string().trim().min(1),
});

export const reparseSchema = z.object({
  correctedText: z.string().trim().min(1),
  issueId: z.string().uuid().optional(),
  mode: z.enum(['append', 'replace']).default('append'),
});

export const parseIssuePatchSchema = z.object({
  status: z.enum(['open', 'resolved', 'ignored']),
});

export const drawRequestSchema = z.object({
  date: dateSchema,
  region: regionSchema,
});

export const manualDrawSchema = drawRequestSchema.extend({
  text: z.string().trim().min(1).optional(),
  results: z.record(z.record(z.array(z.string()))).optional(),
});

export const checkRequestSchema = drawRequestSchema;

export const playerCreateSchema = z.object({
  name: z.string().trim().min(1),
  aliases: z.array(z.string()).optional(),
  rateProfile: z.unknown().optional(),
});

export const playerPatchSchema = playerCreateSchema.partial().extend({
  id: z.string().uuid(),
  active: z.boolean().optional(),
});

export const adminUserCreateSchema = z.object({
  username: z.string().trim().min(3),
  password: z.string().min(8),
  role: z.enum(['admin', 'user']).default('user'),
  active: z.boolean().default(true),
});

export const adminUserPatchSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(8).optional(),
  role: z.enum(['admin', 'user']).optional(),
  active: z.boolean().optional(),
});
