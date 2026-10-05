import { ArrowRight, Handshake, ImagePlus, Loader2, RefreshCw, Save, Trash2 } from 'lucide-react';
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router';

import { EmptyState, Skeleton } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, Section, TextInput } from '@/components/ui/form-controls';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast-context';
import { MediaPickerDialog } from '@/features/media/media-picker-dialog';
import { partnersApi } from '@/features/partners/api';
import { LogoTile } from '@/features/partners/logo-tile';
import {
  fieldErrorsOf,
  type FieldErrors,
  type FormState,
  toInput,
  toState,
} from '@/features/partners/partner-form-state';
import type { Partner } from '@/features/partners/types';
import { ApiError } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';

export default function PartnerEditPage() {
  const { id = 'new' } = useParams();
  return id === 'new' ? <NewEditor /> : <LoadedEditor id={id} />;
}

function EditorSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

/** New partners go to the end of the marquee by default. */
function NewEditor() {
  const { data: nextOrder, error } = useApiQuery('partner-next-order', () =>
    partnersApi.list({ pageSize: 1 }).then((res) => res.meta.total),
  );
  if (nextOrder === undefined && !error) return <EditorSkeleton />;
  return <PartnerEditor key="new" initial={null} nextOrder={nextOrder ?? 0} />;
}

function LoadedEditor({ id }: { id: string }) {
  const { data, error, reload } = useApiQuery(`partner|${id}`, () => partnersApi.get(id));

  if (error && !data) {
    return (
      <EmptyState
        icon={<Handshake />}
        title="تعذّر تحميل الشريك"
        description={describeApiError(error)}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={reload}>
              إعادة المحاولة
            </Button>
            <Button asChild variant="ghost">
              <Link to="/partners">العودة للشركاء</Link>
            </Button>
          </div>
        }
      />
    );
  }
  if (!data || data.id !== id) return <EditorSkeleton />;
  return <PartnerEditor key={data.id} initial={data} />;
}

function PartnerEditor({
  initial,
  nextOrder = 0,
}: {
  initial: Partner | null;
  nextOrder?: number;
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const [partner, setPartner] = useState(initial);
  const [baseline, setBaseline] = useState(() => toState(initial ?? undefined, nextOrder));
  const [state, setState] = useState(baseline);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const skipGuard = useRef(false);

  const dirty = JSON.stringify(state) !== JSON.stringify(baseline);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !skipGuard.current && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function update(patch: Partial<FormState>) {
    setState((s) => ({ ...s, ...patch }));
    setErrors((current) => {
      const keys = Object.keys(patch).map((k) => (k === 'logo' ? 'logoId' : k));
      if (!keys.some((k) => current[k])) return current;
      const next = { ...current };
      for (const key of keys) delete next[key];
      return next;
    });
  }

  const bind = (key: 'nameAr' | 'nameEn' | 'websiteUrl' | 'order') => ({
    value: state[key],
    onChange: (event: ChangeEvent<HTMLInputElement>) => update({ [key]: event.target.value }),
    'aria-invalid': errors[key] ? true : undefined,
  });

  function reportErrors(found: FieldErrors) {
    setErrors(found);
    toast({
      tone: 'error',
      title: 'تحقق من الحقول المطلوبة',
      description: 'بعض الحقول تحتاج إلى تصحيح قبل الحفظ.',
    });
  }

  async function save(event?: FormEvent) {
    event?.preventDefault();
    const { input, errors: found } = toInput(state);
    if (!input) return reportErrors(found);

    setSaving(true);
    setErrors({});
    try {
      if (!partner) {
        const created = await partnersApi.create(input);
        skipGuard.current = true;
        toast({ title: 'تمت إضافة الشريك', description: created.nameAr });
        void navigate(`/partners/${created.id}`, { replace: true });
        return;
      }
      const updated = await partnersApi.update(partner.id, input);
      const next = toState(updated);
      setPartner(updated);
      setBaseline(next);
      setState(next);
      toast({ title: 'تم حفظ التغييرات' });
    } catch (err) {
      const fieldErrors = fieldErrorsOf(err);
      if (Object.keys(fieldErrors).length > 0) return reportErrors(fieldErrors);
      toast({
        tone: 'error',
        title: 'تعذّر حفظ الشريك',
        description: err instanceof ApiError ? describeApiError(err) : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!partner) return;
    setDeleting(true);
    try {
      await partnersApi.remove(partner.id);
      skipGuard.current = true;
      toast({ title: 'تم حذف الشريك', description: partner.nameAr });
      void navigate('/partners', { replace: true });
    } catch (err) {
      setDeleting(false);
      toast({
        tone: 'error',
        title: 'تعذّر حذف الشريك',
        description: err instanceof ApiError ? describeApiError(err) : undefined,
      });
    }
  }

  const title = state.nameAr.trim() || partner?.nameAr || 'شريك جديد';
  const submitLabel = partner ? 'حفظ التغييرات' : 'إضافة الشريك';

  return (
    <form className="grid gap-6 pb-24" onSubmit={(e) => void save(e)} noValidate>
      <div className="grid gap-3">
        <Link
          to="/partners"
          className="inline-flex items-center gap-1.5 justify-self-start text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="size-4 ltr:rotate-180" /> الشركاء
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {partner ? (
                <>
                  <Badge tone={partner.visible ? 'success' : 'neutral'}>
                    {partner.visible ? 'ظاهر في الموقع' : 'مخفي'}
                  </Badge>
                  <span>آخر تحديث {formatDate(partner.updatedAt)}</span>
                </>
              ) : (
                <span>أدخل اسم الشريك واختر شعاره ثم احفظ.</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {partner && (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 /> حذف
              </Button>
            )}
            <Button type="submit" disabled={saving || (!!partner && !dirty)}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-6">
          <Section
            title="بيانات الشريك"
            description="الاسم يُستخدم نصًا بديلًا للشعار وفي بيانات محركات البحث."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="اسم الشريك (عربي)" required error={errors.nameAr}>
                <TextInput {...bind('nameAr')} maxLength={160} placeholder="البنك الأهلي السعودي" />
              </Field>
              <Field label="اسم الشريك (إنجليزي)" required error={errors.nameEn}>
                <TextInput {...bind('nameEn')} dir="ltr" maxLength={160} placeholder="SNB" />
              </Field>
              <Field
                label="الموقع الإلكتروني"
                className="md:col-span-2"
                hint="اختياري — رابط كامل، مثل https://example.com"
                error={errors.websiteUrl}
              >
                <TextInput
                  {...bind('websiteUrl')}
                  type="url"
                  dir="ltr"
                  maxLength={500}
                  placeholder="https://"
                />
              </Field>
            </div>
          </Section>

          <Section
            title="الشعار"
            description="يُعرض داخل بطاقة داكنة بحجم 112×54 تقريبًا. يُفضّل PNG أو SVG بخلفية شفافة."
            actions={
              state.logo && (
                <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>
                  <RefreshCw /> استبدال الشعار
                </Button>
              )
            }
          >
            {state.logo ? (
              <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
                <LogoTile logo={state.logo} alt={state.nameAr} className="h-[84px] w-[150px] p-4" />
                <p className="text-xs text-muted-foreground">
                  معاينة بحجم البطاقة في شريط الشركاء.
                  {state.logo.width && state.logo.height ? (
                    <>
                      {' '}
                      الأبعاد الأصلية:{' '}
                      <bdi dir="ltr">
                        {state.logo.width} × {state.logo.height}
                      </bdi>
                    </>
                  ) : null}
                </p>
              </div>
            ) : (
              <EmptyState
                icon={<ImagePlus />}
                title="لم يُختر شعار"
                description="لا يظهر الشريك في الموقع بدون شعار."
                action={
                  <Button type="button" onClick={() => setPicking(true)}>
                    <ImagePlus /> اختيار شعار
                  </Button>
                }
              />
            )}
            {errors.logoId && <p className="text-xs text-destructive">{errors.logoId}</p>}
          </Section>
        </div>

        <div className="grid gap-6 xl:sticky xl:top-20">
          <Section title="العرض في الموقع">
            <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
              <span className="grid gap-0.5 text-sm">
                <span className="font-medium">ظاهر في الموقع</span>
                <span className="text-xs text-muted-foreground">أوقفه لإخفاء الشعار دون حذفه</span>
              </span>
              <Switch checked={state.visible} onCheckedChange={(visible) => update({ visible })} />
            </label>
            <Field label="ترتيب العرض" hint="الأصغر يظهر أولًا في الشريط." error={errors.order}>
              <TextInput {...bind('order')} type="number" min={0} dir="ltr" />
            </Field>
          </Section>
        </div>
      </div>

      {(dirty || !partner) && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 shadow-[0_-4px_16px_rgb(0_0_0/0.06)] backdrop-blur md:start-64">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-3 lg:px-8">
            <p className="flex items-center gap-2 text-sm">
              <span className="size-2 rounded-full bg-warning" />
              {partner ? 'لديك تغييرات غير محفوظة' : 'شريك جديد — لم يُحفظ بعد'}
            </p>
            <div className="flex gap-2">
              {partner ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={saving}
                  onClick={() => {
                    setState(baseline);
                    setErrors({});
                  }}
                >
                  تجاهل التغييرات
                </Button>
              ) : (
                <Button asChild variant="ghost">
                  <Link to="/partners">إلغاء</Link>
                </Button>
              )}
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                {submitLabel}
              </Button>
            </div>
          </div>
        </div>
      )}

      <MediaPickerDialog
        open={picking}
        onOpenChange={setPicking}
        title="اختيار شعار الشريك"
        confirmLabel="اعتماد الشعار"
        onSelect={([item]) => item && update({ logo: item })}
      />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => !open && blocker.reset?.()}
        title="مغادرة دون حفظ؟"
        description="لديك تغييرات غير محفوظة لهذا الشريك وستفقدها إذا غادرت الصفحة."
        confirmLabel="مغادرة دون حفظ"
        onConfirm={() => blocker.proceed?.()}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        busy={deleting}
        title="حذف الشريك؟"
        description={`سيُحذف «${partner?.nameAr ?? ''}» ويختفي شعاره من الموقع.`}
        onConfirm={() => void remove()}
      />
    </form>
  );
}
