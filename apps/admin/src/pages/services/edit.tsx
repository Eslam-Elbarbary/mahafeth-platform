import {
  ArrowRight,
  ExternalLink,
  FileText,
  Images,
  Loader2,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router';

import { EmptyState, Skeleton } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast-context';
import { PublishBadge } from '@/features/projects/project-badges';
import { servicesApi } from '@/features/services/api';
import {
  type EditorTab,
  fieldErrorsOf,
  type FieldErrors,
  type FormState,
  tabOfField,
  tabsWithErrors,
  toInput,
  toState,
} from '@/features/services/service-form-state';
import { GeneralTab, MediaTab, SeoTab } from '@/features/services/service-form-tabs';
import type { Service } from '@/features/services/types';
import { ApiError } from '@/lib/api-client';
import { env } from '@/lib/env';
import { formatDate } from '@/lib/format';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';

const TABS: Array<{ value: EditorTab; label: string; icon: typeof FileText }> = [
  { value: 'general', label: 'المعلومات العامة', icon: FileText },
  { value: 'media', label: 'الوسائط', icon: Images },
  { value: 'seo', label: 'تحسين محركات البحث', icon: Search },
];
const isTab = (value: string | null): value is EditorTab => TABS.some((t) => t.value === value);

export default function ServiceEditPage() {
  const { id = 'new' } = useParams();
  return id === 'new' ? <ServiceEditor key="new" initial={null} /> : <LoadedEditor id={id} />;
}

function LoadedEditor({ id }: { id: string }) {
  const { data, error, reload } = useApiQuery(`service|${id}`, () => servicesApi.get(id));

  if (error && !data) {
    return (
      <EmptyState
        icon={<FileText />}
        title="تعذّر تحميل الخدمة"
        description={describeApiError(error)}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={reload}>
              إعادة المحاولة
            </Button>
            <Button asChild variant="ghost">
              <Link to="/services">العودة للخدمات</Link>
            </Button>
          </div>
        }
      />
    );
  }
  if (!data || data.id !== id) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  return <ServiceEditor key={data.id} initial={data} />;
}

function ServiceEditor({ initial }: { initial: Service | null }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab: EditorTab = isTab(tabParam) ? tabParam : 'general';

  const [service, setService] = useState(initial);
  const [baseline, setBaseline] = useState(() => toState(initial ?? undefined));
  const [state, setState] = useState(baseline);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const skipGuard = useRef(false);

  const dirty = JSON.stringify(state) !== JSON.stringify(baseline);
  const errorTabs = tabsWithErrors(errors);

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

  function setTab(next: string) {
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        if (next === 'general') copy.delete('tab');
        else copy.set('tab', next);
        return copy;
      },
      { replace: true },
    );
  }

  function update(patch: Partial<FormState>) {
    setState((s) => ({ ...s, ...patch }));
    setErrors((current) => {
      const keys = Object.keys(patch).map((k) => (k === 'image' ? 'imageId' : k));
      if (!keys.some((k) => current[k])) return current;
      const next = { ...current };
      for (const key of keys) delete next[key];
      return next;
    });
  }

  function reportErrors(found: FieldErrors) {
    setErrors(found);
    const first = Object.keys(found).find((key) => found[key]);
    if (first) setTab(tabOfField(first));
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
      if (!service) {
        const created = await servicesApi.create(input);
        skipGuard.current = true;
        toast({ title: 'تم إنشاء الخدمة', description: created.titleAr });
        void navigate(`/services/${created.id}`, { replace: true });
        return;
      }
      const updated = await servicesApi.update(service.id, input);
      const next = toState(updated);
      setService(updated);
      setBaseline(next);
      setState(next);
      toast({ title: 'تم حفظ التغييرات' });
    } catch (err) {
      const fieldErrors = fieldErrorsOf(err);
      if (Object.keys(fieldErrors).length > 0) return reportErrors(fieldErrors);
      toast({
        tone: 'error',
        title: 'تعذّر حفظ الخدمة',
        description: err instanceof ApiError ? describeApiError(err) : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!service) return;
    setDeleting(true);
    try {
      await servicesApi.remove(service.id);
      skipGuard.current = true;
      toast({ title: 'تم حذف الخدمة', description: service.titleAr });
      void navigate('/services', { replace: true });
    } catch (err) {
      setDeleting(false);
      toast({
        tone: 'error',
        title: 'تعذّر حذف الخدمة',
        description: err instanceof ApiError ? describeApiError(err) : undefined,
      });
    }
  }

  const title = state.titleAr.trim() || service?.titleAr || 'خدمة جديدة';
  const tabProps = { state, update, errors };
  const submitLabel = service ? 'حفظ التغييرات' : 'إنشاء الخدمة';

  return (
    <form className="grid gap-6 pb-24" onSubmit={(e) => void save(e)} noValidate>
      <div className="grid gap-3">
        <Link
          to="/services"
          className="inline-flex items-center gap-1.5 justify-self-start text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="size-4 ltr:rotate-180" /> الخدمات
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {service ? (
                <>
                  <PublishBadge status={service.status} />
                  <span>آخر تحديث {formatDate(service.updatedAt)}</span>
                </>
              ) : (
                <span>أدخل بيانات الخدمة وصورتها ثم احفظ.</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {service?.status === 'PUBLISHED' && (
              <Button asChild variant="outline">
                <a
                  href={`${env.siteUrl}/ar/services/${service.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink /> عرض في الموقع
                </a>
              </Button>
            )}
            {service && (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 /> حذف
              </Button>
            )}
            <Button type="submit" disabled={saving || (!!service && !dirty)}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="grid gap-6">
        <TabsList className="sticky top-16 z-10 bg-canvas">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value}>
              <Icon /> {label}
              {errorTabs.has(value) && (
                <span className="size-2 rounded-full bg-destructive" aria-label="يحتوي أخطاء" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general">
          <GeneralTab {...tabProps} />
        </TabsContent>
        <TabsContent value="media">
          <MediaTab {...tabProps} />
        </TabsContent>
        <TabsContent value="seo">
          <SeoTab {...tabProps} />
        </TabsContent>
      </Tabs>

      {(dirty || !service) && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 shadow-[0_-4px_16px_rgb(0_0_0/0.06)] backdrop-blur md:start-64">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-3 lg:px-8">
            <p className="flex items-center gap-2 text-sm">
              <span className="size-2 rounded-full bg-warning" />
              {service ? 'لديك تغييرات غير محفوظة' : 'خدمة جديدة — لم تُحفظ بعد'}
            </p>
            <div className="flex gap-2">
              {service ? (
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
                  <Link to="/services">إلغاء</Link>
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

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => !open && blocker.reset?.()}
        title="مغادرة دون حفظ؟"
        description="لديك تغييرات غير محفوظة في هذه الخدمة وستفقدها إذا غادرت الصفحة."
        confirmLabel="مغادرة دون حفظ"
        onConfirm={() => blocker.proceed?.()}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        busy={deleting}
        title="حذف الخدمة؟"
        description={`ستُحذف «${service?.titleAr ?? ''}» وتختفي من الموقع وقوائمه.`}
        onConfirm={() => void remove()}
      />
    </form>
  );
}
