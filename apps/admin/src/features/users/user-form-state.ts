import type { Role } from '@/features/auth/types';
import { ApiError } from '@/lib/api-client';

import { PASSWORD_MIN, type User, type UserCreateInput, userErrorMessages } from './types';

export type FormState = {
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  /** Create only; existing users get a new password through "reset password". */
  password: string;
};

export type FieldErrors = Partial<Record<keyof FormState, string>>;

export function toState(user?: User): FormState {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    role: user?.role ?? 'EDITOR',
    isActive: user?.isActive ?? true,
    password: '',
  };
}

const REQUIRED = 'هذا الحقل مطلوب';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function passwordError(password: string) {
  if (!password) return REQUIRED;
  if (password.length < PASSWORD_MIN) return `استخدم ${PASSWORD_MIN} أحرف على الأقل`;
  if (password.length > 128) return 'كلمة المرور أطول من المسموح';
  return undefined;
}

/** Form state → API body, plus the checks the backend would reject anyway. */
export function toInput(
  state: FormState,
  isNew: boolean,
): { input?: UserCreateInput; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const email = state.email.trim().toLowerCase();
  if (!state.name.trim()) errors.name = REQUIRED;
  if (!email) errors.email = REQUIRED;
  else if (!EMAIL.test(email)) errors.email = 'أدخل بريدًا إلكترونيًا صحيحًا';
  if (isNew) errors.password = passwordError(state.password);

  if (Object.values(errors).some(Boolean)) return { errors };
  return {
    errors: {},
    input: {
      name: state.name.trim(),
      email,
      role: state.role,
      isActive: state.isActive,
      password: state.password,
    },
  };
}

/** A strong random password (no look-alike characters) for the "generate" button. */
export function generatePassword(length = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%*';
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (n) => chars[n % chars.length]).join('');
}

type Flattened = { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> };

/** Backend validation and rule errors → first message per field. */
export function fieldErrorsOf(err: unknown): FieldErrors {
  if (!(err instanceof ApiError)) return {};
  if (err.code === 'EMAIL_TAKEN') return { email: userErrorMessages.EMAIL_TAKEN };
  if (err.code !== 'VALIDATION_ERROR') return {};
  const details = err.details as Flattened | undefined;
  return Object.fromEntries(
    Object.entries(details?.fieldErrors ?? {}).map(([key, messages]) => [key, messages?.[0]]),
  );
}
