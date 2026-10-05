import {
  ExternalLink,
  Languages,
  Loader2,
  Palette,
  PanelBottom,
  Phone,
  Save,
  Search,
  Settings,
  Share2,
} from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useBlocker, useSearchParams } from 'react-router';

import { EmptyState, PageHeader, Skeleton } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast-context';
import { mediaApi } from '@/features/media/api';
import type { MediaSummary } from '@/features/media/types';
import { settingsApi } from '@/features/settings/api';
import {
  fieldErrorsOf,
  type FieldErrors,
  type FormState,
  mediaIdsOf,
  type SettingsTab,
  tabOfField,
  tabsWithErrors,
  toInput,
  toState,
} from '@/features/settings/settings-form-state';
import {
  BrandingTab,
  ContactTab,
  FooterTab,
  SeoTab,
  SocialTab,
} from '@/features/settings/settings-form-tabs';
import { ApiError } from '@/lib/api-client';
import { env } from '@/lib/env';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';

const TABS: Array<{ value: SettingsTab; label: string; icon: typeof Settings }> = [
  { value: 'branding', label: 'الهوية', icon: Palette },
  { value: 'contact', label: 'التواصل', icon: Phone },
  { value: 'social', label: 'التواصل الاجتماعي', icon: Share2 },
  { value: 'footer', label: 'التذييل', icon: PanelBottom },
  { value: 'seo', label: 'محركات البحث', icon: Search },
];
const isTab = (value: string | null): value is SettingsTab => TABS.some((t) => t.value === value);

/** Settings plus the media they reference (for picker previews); a deleted image loads as empty. */
async function loadSettings() {
  const settings = await settingsApi.list();
  const media = await Promise.all(
    mediaIdsOf(settings).map((id) => mediaApi.get(id).catch(() => null)),
  );
  const byId = new Map<string, MediaSummary>();
  for (const item of media) if (item) byId.set(item.id, item);
  return toState(settings, byId);
}

export default function SettingsPage() {
  const { data, error, reload } = useApiQuery('settings', loadSettings);

  if (error && !data) {
    return (
      <EmptyState
        icon={<Settings />}
        title="تعذّر تحميل الإعدادات"
        description={describeApiError(error)}
        action={
          <Button variant="outline" onClick={reload}>
            إعادة المحاولة
          </Button>
        }
      />
    );
  }
  if (!data) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  return <SettingsEditor initial={data} />;
}

function SettingsEditor({ initial }: { initial: FormState }) {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab: SettingsTab = isTab(tabParam) ? tabParam : 'branding';

  const [baseline, setBaseline] = useState(initial);
  const [state, setState] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(state) !== JSON.stringify(baseline);
  const errorTabs = tabsWithErrors(errors);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
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
        if (next === 'branding') copy.delete('tab');
        else copy.set('tab', next);
        return copy;
      },
      { replace: true },
    );
  }

  function update(patch: Partial<FormState>) {
    setState((s) => ({ ...s, ...patch }));
    setErrors((current) => {
      const fields = Object.keys(patch);
      const stale = Object.keys(current).filter((key) => fields.includes(key.split('.')[0]!));
      if (stale.length === 0) return current;
      const next = { ...current };
      for (const key of stale) delete next[key];
      return next;
    });
  }

  function reportErrors(found: FieldErrors) {
    setErrors(found);
    const first = Object.keys(found).find((key) => found[key]);
    if (first && !tabsWithErrors(found).has(tab)) setTab(tabOfField(first));
    toast({
      tone: 'error',
      title: 'تحقق من الحقول',
      description: 'بعض الحقول تحتاج إلى تصحيح قبل الحفظ.',
    });
  }

  async function save(event?: FormEvent) {
    event?.preventDefault();
    const { items, next, errors: found } = toInput(state, baseline);
    if (!items || !next) return reportErrors(found);
    if (items.length === 0) {
      setState(next);
      setBaseline(next);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      await settingsApi.save(items);
      setBaseline(next);
      setState(next);
      toast({ title: 'تم حفظ الإعدادات', description: 'ستظهر التغييرات في الموقع خلال لحظات.' });
    } catch (err) {
      const fieldErrors = fieldErrorsOf(err);
      if (Object.keys(fieldErrors).length > 0) return reportErrors(fieldErrors);
      toast({
        tone: 'error',
        title: 'تعذّر حفظ الإعدادات',
        description: err instanceof ApiError ? describeApiError(err) : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  const tabProps = { state, update, errors };

  return (
    <form className="grid gap-6 pb-24" onSubmit={(e) => void save(e)} noValidate>
      <PageHeader
        title="إعدادات الموقع"
        description="الهوية وبيانات التواصل والتذييل وبيانات محركات البحث التي تظهر في جميع صفحات الموقع."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/settings/content">
                <Languages /> المحتوى العام
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href={`${env.siteUrl}/ar`} target="_blank" rel="noreferrer">
                <ExternalLink /> عرض الموقع
              </a>
            </Button>
            <Button type="submit" disabled={saving || !dirty}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              حفظ الإعدادات
            </Button>
          </>
        }
      />

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

        <TabsContent value="branding">
          <BrandingTab {...tabProps} />
        </TabsContent>
        <TabsContent value="contact">
          <ContactTab {...tabProps} />
        </TabsContent>
        <TabsContent value="social">
          <SocialTab {...tabProps} />
        </TabsContent>
        <TabsContent value="footer">
          <FooterTab {...tabProps} />
        </TabsContent>
        <TabsContent value="seo">
          <SeoTab {...tabProps} />
        </TabsContent>
      </Tabs>

      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 shadow-[0_-4px_16px_rgb(0_0_0/0.06)] backdrop-blur md:start-64">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-3 lg:px-8">
            <p className="flex items-center gap-2 text-sm">
              <span className="size-2 rounded-full bg-warning" />
              لديك تغييرات غير محفوظة
            </p>
            <div className="flex gap-2">
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
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                حفظ الإعدادات
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => !open && blocker.reset?.()}
        title="مغادرة دون حفظ؟"
        description="لديك تغييرات غير محفوظة في الإعدادات وستفقدها إذا غادرت الصفحة."
        confirmLabel="مغادرة دون حفظ"
        onConfirm={() => blocker.proceed?.()}
      />
    </form>
  );
}
