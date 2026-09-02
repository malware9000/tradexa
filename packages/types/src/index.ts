export type AccountStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'VERIFIED'
  | 'CLOSED';

export type KycStatus =
  | 'NOT_SUBMITTED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export type EntryType =
  | 'DEPOSIT'
  | 'TEST_CREDIT'
  | 'WITHDRAWAL'
  | 'FEE'
  | 'ADJUSTMENT'
  | 'REVERSAL'
  | 'REFUND'
  | 'TRADING_PNL';

export type Direction = 'CREDIT' | 'DEBIT';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESSFUL'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'REVERSED';

export type WithdrawalStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'FAILED';

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'FINANCE_ADMIN'
  | 'SUPPORT_ADMIN'
  | 'COMPLIANCE_ADMIN'
  | 'READ_ONLY_ADMIN';

export type NotificationType =
  | 'ACCOUNT_CREATED'
  | 'EMAIL_VERIFIED'
  | 'DEPOSIT_INITIATED'
  | 'DEPOSIT_CONFIRMED'
  | 'DEPOSIT_FAILED'
  | 'TEST_CREDIT_POSTED'
  | 'WITHDRAWAL_REQUESTED'
  | 'WITHDRAWAL_APPROVED'
  | 'WITHDRAWAL_COMPLETED'
  | 'WITHDRAWAL_REJECTED'
  | 'SECURITY_ALERT'
  | 'SUPPORT_REPLY';

export interface UserDto {
  id: string;
  email: string;
  emailVerified: boolean;
  status: AccountStatus;
  kycStatus: KycStatus;
  twoFactorEnabled: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}
