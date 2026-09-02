import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(120).optional(),
  phone: z.string().max(30).optional(),
  country: z.string().max(60).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const depositCreateSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).default('USD'),
  provider: z.string().min(1),
});

export const withdrawalCreateSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).default('USD'),
  method: z.string().optional(),
  destinationReference: z.string().min(1),
});

export const adminAdjustmentSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().finite().refine((n) => n !== 0, {
    message: 'Adjustment amount must be non-zero',
  }),
  reason: z.string().min(3),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(120).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  country: z.string().max(60).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
});

export const adminUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'VERIFIED', 'CLOSED', 'PENDING']),
  reason: z.string().max(300).optional(),
});

export const depositActionSchema = z.object({
  action: z.enum(['confirm', 'reject']),
  reason: z.string().max(300).optional(),
});

export const withdrawalActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'complete']),
  reason: z.string().max(300).optional(),
});

export const settingsUpdateSchema = z.object({
  test_return_rate: z.coerce.number().min(0).max(1).optional(),
  test_return_period_hours: z.coerce.number().int().min(1).max(8760).optional(),
  minimum_deposit: z.coerce.number().min(0).optional(),
  maximum_deposit: z.coerce.number().min(0).optional(),
  minimum_withdrawal: z.coerce.number().min(0).optional(),
  maximum_withdrawal: z.coerce.number().min(0).optional(),
  withdrawal_fee: z.coerce.number().min(0).optional(),
  maintenance_mode: z.boolean().optional(),
  registration_enabled: z.boolean().optional(),
  withdrawals_enabled: z.boolean().optional(),
  deposits_enabled: z.boolean().optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ticketStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED']),
});

export const ticketReplySchema = z.object({
  message: z.string().min(1).max(5000),
});

export const ticketCreateSchema = z.object({
  category: z.string().min(1).max(80),
  subject: z.string().min(1).max(160),
  message: z.string().min(1).max(5000),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type AdminLoginDto = z.infer<typeof adminLoginSchema>;
export type DepositCreateDto = z.infer<typeof depositCreateSchema>;
export type WithdrawalCreateDto = z.infer<typeof withdrawalCreateSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type AdminUserStatusDto = z.infer<typeof adminUserStatusSchema>;
export type DepositActionDto = z.infer<typeof depositActionSchema>;
export type WithdrawalActionDto = z.infer<typeof withdrawalActionSchema>;
export type SettingsUpdateDto = z.infer<typeof settingsUpdateSchema>;
export type TicketStatusDto = z.infer<typeof ticketStatusSchema>;
export type TicketReplyDto = z.infer<typeof ticketReplySchema>;
export type TicketCreateDto = z.infer<typeof ticketCreateSchema>;
