import { KeyRound, LoaderCircle } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast-context';

import { describeUserError, usersApi } from './api';
import { PasswordField } from './password-field';
import type { User } from './types';
import { fieldErrorsOf, passwordError } from './user-form-state';

function ResetPasswordForm({ user, onDone }: { user: User; onDone: () => void }) {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const invalid = passwordError(password);
    if (invalid) return setError(invalid);
    setSaving(true);
    try {
      await usersApi.resetPassword(user.id, password);
      toast({ title: 'تم تعيين كلمة المرور الجديدة', description: user.name });
      onDone();
    } catch (err) {
      const fieldError = fieldErrorsOf(err).password;
      if (fieldError) setError(fieldError);
      else
        toast({
          tone: 'error',
          title: 'تعذّر تغيير كلمة المرور',
          description: describeUserError(err),
        });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="grid gap-4" noValidate>
      <PasswordField
        label="كلمة المرور الجديدة"
        value={password}
        onChange={(value) => {
          setPassword(value);
          setError(undefined);
        }}
        error={error}
        autoFocus
      />
      <DialogFooter>
        <Button type="button" variant="outline" disabled={saving} onClick={onDone}>
          إلغاء
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? <LoaderCircle className="animate-spin" /> : <KeyRound />}
          تعيين كلمة المرور
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Sets a new password for another user; they sign in with it from now on. */
export function ResetPasswordDialog({
  user,
  onOpenChange,
}: {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
          <DialogDescription>
            {user && (
              <>كلمة مرور جديدة لـ «{user.name}». تتوقف كلمة المرور الحالية عن العمل فور الحفظ.</>
            )}
          </DialogDescription>
        </DialogHeader>
        {user && <ResetPasswordForm key={user.id} user={user} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
