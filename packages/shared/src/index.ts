export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const DEFAULT_TEST_RETURN_RATE = 0.02; // 2% per 24-hour test period
export const DEFAULT_TEST_RETURN_PERIOD_HOURS = 24;
export const DEFAULT_CURRENCY = 'USD';

export const SETTINGS_KEYS = {
  TEST_RETURN_RATE: 'test_return_rate',
  TEST_RETURN_PERIOD_HOURS: 'test_return_period_hours',
  MINIMUM_DEPOSIT: 'minimum_deposit',
  MAXIMUM_DEPOSIT: 'maximum_deposit',
  MINIMUM_WITHDRAWAL: 'minimum_withdrawal',
  MAXIMUM_WITHDRAWAL: 'maximum_withdrawal',
  WITHDRAWAL_FEE: 'withdrawal_fee',
  MAINTENANCE_MODE: 'maintenance_mode',
  REGISTRATION_ENABLED: 'registration_enabled',
  WITHDRAWALS_ENABLED: 'withdrawals_enabled',
  DEPOSITS_ENABLED: 'deposits_enabled',
} as const;

export function toMoney(value: number, currency = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}
