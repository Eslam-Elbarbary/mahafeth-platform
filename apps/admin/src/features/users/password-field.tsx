import { Copy, Eye, EyeOff, WandSparkles } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, TextInput } from '@/components/ui/form-controls';
import { useToast } from '@/components/ui/toast-context';

import { PASSWORD_MIN } from './types';
import { generatePassword } from './user-form-state';

/** Password input with show/hide, a strong-password generator and copy. */
export function PasswordField({
  label,
  value,
  onChange,
  error,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoFocus?: boolean;
}) {
  const toast = useToast();
  const [visible, setVisible] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: 'تم نسخ كلمة المرور' });
    } catch {
      toast({ tone: 'error', title: 'تعذّر النسخ، انسخها يدويًا' });
    }
  }

  return (
    <Field
      label={label}
      required
      error={error}
      hint={`${PASSWORD_MIN} أحرف على الأقل. شارك كلمة المرور مع المستخدم بطريقة آمنة.`}
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <TextInput
            type={visible ? 'text' : 'password'}
            name="password"
            dir="ltr"
            autoComplete="new-password"
            autoFocus={autoFocus}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={Boolean(error)}
            className="pe-9"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 end-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="توليد كلمة مرور قوية"
          title="توليد كلمة مرور قوية"
          onClick={() => {
            onChange(generatePassword());
            setVisible(true);
          }}
        >
          <WandSparkles />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="نسخ كلمة المرور"
          title="نسخ كلمة المرور"
          disabled={!value}
          onClick={() => void copy()}
        >
          <Copy />
        </Button>
      </div>
    </Field>
  );
}
