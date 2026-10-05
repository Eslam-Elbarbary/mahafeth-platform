import { LoaderCircle } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Navigate, useLocation } from 'react-router';

import { Button } from '@/components/ui/button';
import { Field, TextInput } from '@/components/ui/form-controls';
import { useAuth } from '@/features/auth/auth-context';
import type { LoginLocationState } from '@/features/auth/require-auth';
import { ApiError } from '@/lib/api-client';

type FieldErrors = { email?: string; password?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = 'أدخل البريد الإلكتروني';
  else if (!EMAIL.test(email.trim())) errors.email = 'أدخل بريدًا إلكترونيًا صحيحًا';
  if (!password) errors.password = 'أدخل كلمة المرور';
  return errors;
}

function loginErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
  if (error.status === 401) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  if (error.status === 400) return 'تحقق من صيغة البريد الإلكتروني وكلمة المرور.';
  if (error.status === 429) return 'محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.';
  if (error.isUnavailable)
    return 'الخادم غير متاح حاليًا. تأكد من تشغيل الواجهة البرمجية وحاول مجددًا.';
  return error.message;
}

/** Only same-app paths; never bounce back to `/login` itself. */
function safeRedirect(from: string | undefined) {
  return from?.startsWith('/') && !from.startsWith('//') && !from.startsWith('/login') ? from : '/';
}

export default function LoginPage() {
  const { status, login, signedOutReason } = useAuth();
  const location = useLocation();
  const redirectTo = safeRedirect((location.state as LoginLocationState | null)?.from);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') return <Navigate to={redirectTo} replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const errors = validate(email, password);
    setFieldErrors(errors);
    setFormError(null);
    if (errors.email || errors.password) return;

    setSubmitting(true);
    try {
      await login({ email, password });
    } catch (error) {
      setFormError(loginErrorMessage(error));
      setPassword('');
      setSubmitting(false);
    }
  }

  const notice =
    signedOutReason === 'expired'
      ? 'انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى.'
      : signedOutReason === 'logout'
        ? 'تم تسجيل خروجك بنجاح.'
        : null;

  return (
    <main className="grid min-h-svh lg:grid-cols-[1fr_minmax(0,28rem)]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <img src="/logo-seal-192.png" alt="" className="size-11 rounded-full bg-white/90 p-0.5" />
          <span className="text-lg font-bold text-white">محافظ للاستثمار العقاري</span>
        </div>
        <div className="grid max-w-md gap-3">
          <h1 className="text-3xl leading-snug font-bold text-white">لوحة إدارة محتوى الموقع</h1>
          <p className="leading-relaxed text-sidebar-foreground/75">
            أدِر المشاريع والصور ومحتوى الموقع من مكان واحد، وتنعكس التحديثات على الموقع خلال دقائق.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">© محافظ للاستثمار العقاري</p>
        <div
          aria-hidden
          className="absolute -bottom-32 -left-32 size-96 rounded-full bg-sidebar-primary/20 blur-3xl"
        />
      </div>

      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <form className="grid w-full max-w-sm gap-5" onSubmit={submit} noValidate>
          <div className="grid gap-2">
            <img src="/logo-seal-192.png" alt="" className="size-12 rounded-full lg:hidden" />
            <h2 className="text-2xl font-bold">تسجيل الدخول</h2>
            <p className="text-sm text-muted-foreground">
              أدخل بيانات حسابك للوصول إلى لوحة التحكم.
            </p>
          </div>

          {notice && !formError && (
            <p className="rounded-md border bg-muted p-3 text-sm" role="status">
              {notice}
            </p>
          )}
          {formError && (
            <p
              className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
              role="alert"
            >
              {formError}
            </p>
          )}

          <Field label="البريد الإلكتروني" error={fieldErrors.email}>
            <TextInput
              type="email"
              dir="ltr"
              autoComplete="username"
              autoFocus
              value={email}
              placeholder="name@mahafeth.sa"
              aria-invalid={Boolean(fieldErrors.email)}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </Field>
          <Field label="كلمة المرور" error={fieldErrors.password}>
            <TextInput
              type="password"
              dir="ltr"
              autoComplete="current-password"
              value={password}
              aria-invalid={Boolean(fieldErrors.password)}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </Field>
          <Button type="submit" size="lg" disabled={submitting} className="mt-1">
            {submitting && <LoaderCircle className="animate-spin" />}
            {submitting ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}
          </Button>
        </form>
      </div>
    </main>
  );
}
