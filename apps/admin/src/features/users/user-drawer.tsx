import { KeyRound, LoaderCircle, Save, Trash2, UserPlus } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, TextInput } from '@/components/ui/form-controls';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast-context';
import type { Role } from '@/features/auth/types';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

import { describeUserError, usersApi } from './api';
import { PasswordField } from './password-field';
import { ROLES, roleMeta, type User } from './types';
import { RoleBadge } from './user-badges';
import {
  type FieldErrors,
  fieldErrorsOf,
  type FormState,
  toInput,
  toState,
} from './user-form-state';

function RoleSelector({
  value,
  onChange,
  disabled,
}: {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="الدور" className="grid gap-2">
      {ROLES.map((role) => {
        const checked = value === role;
        return (
          <button
            key={role}
            type="button"
            role="radio"
            aria-checked={checked}
            data-role={role}
            disabled={disabled}
            onClick={() => onChange(role)}
            className={cn(
              'grid gap-1 rounded-lg border p-3 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-60',
              checked ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-accent',
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <RoleBadge role={role} />
              <span
                aria-hidden
                className={cn(
                  'size-4 rounded-full border',
                  checked && 'border-4 border-primary bg-background',
                )}
              />
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              {roleMeta[role].description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function UserForm({
  user,
  isSelf,
  onSaved,
  onResetPassword,
  onDelete,
}: {
  user: User | null;
  isSelf: boolean;
  onSaved: (user: User, created: boolean) => void;
  onResetPassword: (user: User) => void;
  onDelete: (user: User) => void;
}) {
  const toast = useToast();
  const isNew = user === null;
  const [state, setState] = useState<FormState>(() => toState(user ?? undefined));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    const { input, errors: invalid } = toInput(state, isNew);
    setErrors(invalid);
    if (!input) return;
    setSaving(true);
    try {
      const { name, email, role, isActive } = input;
      const saved = isNew
        ? await usersApi.create(input)
        : await usersApi.update(
            user.id,
            isSelf ? { name, email } : { name, email, role, isActive },
          );
      toast({ title: isNew ? 'تمت إضافة المستخدم' : 'تم حفظ التغييرات', description: saved.name });
      onSaved(saved, isNew);
    } catch (err) {
      const fieldErrors = fieldErrorsOf(err);
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
      else toast({ tone: 'error', title: 'تعذّر الحفظ', description: describeUserError(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="flex min-h-0 flex-1 flex-col">
      <SheetBody>
        <Field label="الاسم" required error={errors.name}>
          <TextInput
            name="name"
            value={state.name}
            maxLength={120}
            onChange={(e) => set('name', e.target.value)}
            aria-invalid={Boolean(errors.name)}
            autoFocus={isNew}
          />
        </Field>
        <Field
          label="البريد الإلكتروني"
          required
          error={errors.email}
          hint="يُستخدم لتسجيل الدخول."
        >
          <TextInput
            name="email"
            type="email"
            dir="ltr"
            autoComplete="off"
            value={state.email}
            maxLength={191}
            onChange={(e) => set('email', e.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
        </Field>

        {isNew && (
          <PasswordField
            label="كلمة المرور"
            value={state.password}
            onChange={(value) => set('password', value)}
            error={errors.password}
          />
        )}

        <div className="grid gap-2">
          <span className="text-sm font-medium">الدور والصلاحيات</span>
          <RoleSelector
            value={state.role}
            onChange={(role) => set('role', role)}
            disabled={isSelf}
          />
          {isSelf && (
            <span className="text-xs text-muted-foreground">لا يمكنك تغيير دورك بنفسك.</span>
          )}
        </div>

        <label className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <span className="grid gap-0.5">
            <span className="text-sm font-medium">الحساب نشط</span>
            <span className="text-xs text-muted-foreground">
              {isSelf
                ? 'لا يمكنك تعطيل حسابك.'
                : 'الحساب المعطّل لا يستطيع تسجيل الدخول، وتنتهي جلساته الحالية فورًا.'}
            </span>
          </span>
          <Switch
            name="isActive"
            checked={state.isActive}
            disabled={isSelf}
            onCheckedChange={(checked) => set('isActive', checked)}
          />
        </label>

        {user && (
          <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <div className="flex flex-wrap justify-between gap-2">
              <span>
                آخر دخول:{' '}
                {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'لم يسجّل الدخول بعد'}
              </span>
              <span>أُنشئ في {formatDateTime(user.createdAt)}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-self-start"
              onClick={() => onResetPassword(user)}
            >
              <KeyRound /> إعادة تعيين كلمة المرور
            </Button>
          </div>
        )}
      </SheetBody>

      <SheetFooter className="justify-between">
        {user && !isSelf ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(user)}
          >
            <Trash2 /> حذف المستخدم
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={saving}>
          {saving ? <LoaderCircle className="animate-spin" /> : isNew ? <UserPlus /> : <Save />}
          {isNew ? 'إضافة المستخدم' : 'حفظ التغييرات'}
        </Button>
      </SheetFooter>
    </form>
  );
}

/** Create (`target === 'new'`) or edit a user: profile, role, status and password reset. */
export function UserDrawer({
  target,
  currentUserId,
  onClose,
  onSaved,
  onResetPassword,
  onDelete,
}: {
  target: User | 'new' | null;
  currentUserId: string | undefined;
  onClose: () => void;
  onSaved: (user: User, created: boolean) => void;
  onResetPassword: (user: User) => void;
  onDelete: (user: User) => void;
}) {
  const user = target === 'new' ? null : target;
  const isSelf = user?.id === currentUserId;
  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {user ? user.name : 'مستخدم جديد'}
            {user && <RoleBadge role={user.role} />}
            {isSelf && <span className="text-xs font-normal text-muted-foreground">(أنت)</span>}
          </SheetTitle>
          <SheetDescription>
            {user
              ? 'تعديل بيانات المستخدم ودوره وحالة حسابه.'
              : 'أنشئ حسابًا للدخول إلى لوحة التحكم وحدد صلاحياته.'}
          </SheetDescription>
        </SheetHeader>
        {target !== null && (
          <UserForm
            key={user?.id ?? 'new'}
            user={user}
            isSelf={isSelf}
            onSaved={onSaved}
            onResetPassword={onResetPassword}
            onDelete={onDelete}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
