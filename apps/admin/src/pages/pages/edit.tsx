import {
  ArrowRight,
  Eye,
  FileText,
  LayoutList,
  Loader2,
  Plus,
  Save,
  Settings2,
} from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useBlocker, useParams, useSearchParams } from 'react-router';

import { EmptyState, PageHeader, Skeleton } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, Section, Select, TextArea, TextInput } from '@/components/ui/form-controls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast-context';
import { MediaSetting } from '@/features/media/media-setting';
import type { MediaSummary } from '@/features/media/types';
import { pagesApi, sectionsApi } from '@/features/pages/api';
import {
  contentMediaOf,
  type EditorTab,
  fieldErrorsOf,
  type FieldErrors,
  type PageFormState,
  type SectionDraft,
  tabOfField,
  tabsWithErrors,
  toDraft,
  toSavePlan,
  toState,
} from '@/features/pages/page-form-state';
import { SectionCard } from '@/features/pages/section-editor';
import { sectionLabel, sectionSchema } from '@/features/pages/section-schemas';
import {
  type PageDetail,
  PUBLISH_STATUSES,
  publishMeta,
  type PublishStatus,
  type SectionType,
} from '@/features/pages/types';
import { PublishBadge } from '@/features/projects/project-badges';
import { ApiError } from '@/lib/api-client';
import { env } from '@/lib/env';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';

const TABS: Array<{ value: EditorTab; label: string; icon: typeof FileText }> = [
  { value: 'general', label: 'عام', icon: Settings2 },
  { value: 'sections', label: 'الأقسام', icon: LayoutList },
  { value: 'preview', label: 'المعاينة', icon: Eye },
];
const isTab = (value: string | null): value is EditorTab => TABS.some((t) => t.value === value);

export default function PageEditPage() {
  const { slug = '' } = useParams();
  const { data, error, reload } = useApiQuery(`page|${slug}`, () => pagesApi.getBySlug(slug));

  if (error && !data) {
    return (
      <EmptyState
        icon={<FileText />}
        title="تعذّر تحميل الصفحة"
        description={describeApiError(error)}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={reload}>
              إعادة المحاولة
            </Button>
            <Button asChild variant="ghost">
              <Link to="/pages">كل الصفحات</Link>
            </Button>
          </div>
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
  return <PageEditor key={data.id} initial={data} />;
}

type PageFields = Omit<PageFormState, 'sections'>;
type TextKey = {
  [K in keyof PageFields]: PageFields[K] extends string ? K : never;
}[keyof PageFields];

function PageEditor({ initial }: { initial: PageDetail }) {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab: EditorTab = isTab(tabParam) ? tabParam : 'general';

  const [page, setPage] = useState(initial);
  const [baseline, setBaseline] = useState(() => toState(initial));
  const [state, setState] = useState(baseline);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [media, setMedia] = useState(() => contentMediaOf(initial));
  const [newType, setNewType] = useState<SectionType | ''>('');

  const dirty = JSON.stringify(state) !== JSON.stringify(baseline);
  const errorTabs = tabsWithErrors(errors);
  const baseSections = new Map(baseline.sections.map((s) => [s.id, JSON.stringify(s)]));
  const missingTypes = page.sectionTypes.filter(
    (type) => type !== 'RICH_TEXT' && !state.sections.some((s) => s.type === type),
  );

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
        if (next === 'general') copy.delete('tab');
        else copy.set('tab', next);
        return copy;
      },
      { replace: true },
    );
  }

  function clearErrors(match: (key: string) => boolean) {
    setErrors((current) => {
      const stale = Object.keys(current).filter(match);
      if (stale.length === 0) return current;
      const next = { ...current };
      for (const key of stale) delete next[key];
      return next;
    });
  }

  function update(patch: Partial<PageFields>) {
    setState((s) => ({ ...s, ...patch }));
    const fields = Object.keys(patch).map((key) => (key === 'ogImage' ? 'ogImageId' : key));
    clearErrors((key) => fields.includes(key));
  }

  function updateSection(draft: SectionDraft) {
    setState((s) => ({
      ...s,
      sections: s.sections.map((section) => (section.id === draft.id ? draft : section)),
    }));
    clearErrors((key) => key.startsWith(`${draft.id}|`));
  }

  function moveSection(from: number, to: number) {
    setState((s) => {
      const sections = [...s.sections];
      const [moved] = sections.splice(from, 1);
      sections.splice(to, 0, moved!);
      return { ...s, sections };
    });
  }

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const bind = (key: TextKey) => ({
    value: state[key],
    onChange: (event: { target: { value: string } }) => update({ [key]: event.target.value }),
    'aria-invalid': errors[key] ? true : undefined,
  });

  function reportErrors(found: FieldErrors) {
    setErrors(found);
    const invalid = Object.keys(found).filter((key) => found[key]);
    const first = invalid[0];
    if (first && !tabsWithErrors(found).has(tab)) setTab(tabOfField(first));
    setExpanded((current) => {
      const next = new Set(current);
      for (const key of invalid) if (key.includes('|')) next.add(key.split('|')[0]!);
      return next;
    });
    toast({
      tone: 'error',
      title: 'تحقق من الحقول',
      description: 'بعض الحقول تحتاج إلى تصحيح قبل الحفظ.',
    });
  }

  async function save(event?: FormEvent) {
    event?.preventDefault();
    const { plan, errors: found } = toSavePlan(state, baseline, page.slug);
    if (!plan) return reportErrors(found);

    setSaving(true);
    setErrors({});
    const failures: FieldErrors = {};
    const failedSections = new Set<string>();
    let pageFailed = false;
    let orderFailed = false;
    let firstError: unknown;
    const fail = (err: unknown, fieldErrors: FieldErrors) => {
      Object.assign(failures, fieldErrors);
      firstError ??= err;
    };

    try {
      if (plan.page) {
        try {
          await pagesApi.update(page.id, plan.page);
        } catch (err) {
          pageFailed = true;
          fail(err, fieldErrorsOf(err));
        }
      }
      for (const { id, input } of plan.sections) {
        try {
          await sectionsApi.update(id, input);
        } catch (err) {
          failedSections.add(id);
          fail(err, fieldErrorsOf(err, id));
        }
      }
      if (plan.order) {
        try {
          await sectionsApi.reorder(page.id, plan.order);
        } catch (err) {
          orderFailed = true;
          fail(err, {});
        }
      }

      /* Saved parts come back from the server; failed parts keep their unsaved edits. */
      const fresh = await pagesApi.getBySlug(page.slug);
      const saved = toState(fresh);
      const current = new Map(state.sections.map((s) => [s.id, s]));
      const byId = new Map(saved.sections.map((s) => [s.id, s]));
      const order = orderFailed ? state.sections.map((s) => s.id) : saved.sections.map((s) => s.id);
      const { sections: _drafts, ...editedPage } = state;
      const next: PageFormState = {
        ...saved,
        ...(pageFailed && editedPage),
        sections: order.flatMap((id) => {
          const draft = failedSections.has(id) ? current.get(id) : byId.get(id);
          return draft ? [draft] : [];
        }),
      };
      setPage(fresh);
      setMedia((m) => ({ ...m, ...contentMediaOf(fresh) }));
      setBaseline(saved);
      setState(next);
    } catch (err) {
      firstError ??= err;
    } finally {
      setSaving(false);
    }

    if (Object.keys(failures).length > 0) return reportErrors(failures);
    if (firstError) {
      toast({
        tone: 'error',
        title: 'تعذّر حفظ بعض التغييرات',
        description: firstError instanceof ApiError ? describeApiError(firstError) : undefined,
      });
      return;
    }
    toast({ title: 'تم حفظ الصفحة', description: 'ستظهر التغييرات في الموقع خلال لحظات.' });
  }

  async function addSection() {
    if (!newType) return;
    setAdding(true);
    try {
      /* Added hidden, so the design only changes once the admin fills and shows it. */
      const created = await sectionsApi.create(page.id, newType, { visible: false });
      const draft = toDraft(created);
      setBaseline((b) => ({ ...b, sections: [...b.sections, draft] }));
      setState((s) => ({ ...s, sections: [...s.sections, draft] }));
      setExpanded((current) => new Set(current).add(draft.id));
      setNewType('');
      toast({
        title: 'تمت إضافة القسم',
        description: `${sectionLabel(newType)} — مخفي حتى تفعّل إظهاره.`,
      });
    } catch (err) {
      toast({
        tone: 'error',
        title: 'تعذّرت إضافة القسم',
        description: err instanceof ApiError ? describeApiError(err) : undefined,
      });
    } finally {
      setAdding(false);
    }
  }

  const siteUrl = (locale: 'ar' | 'en') => `${env.siteUrl}/${locale}${page.path}`;

  return (
    <form className="grid gap-6 pb-24" onSubmit={(e) => void save(e)} noValidate>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {page.titleAr}
            <PublishBadge status={page.status} />
          </span>
        }
        description={
          <>
            <Link to="/pages" className="inline-flex items-center gap-1 hover:text-foreground">
              <ArrowRight className="size-3.5" /> صفحات الموقع
            </Link>
            <span className="mx-2">·</span>
            <bdi dir="ltr">/{page.path.replace(/^\//, '')}</bdi>
          </>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <a href={siteUrl('ar')} target="_blank" rel="noreferrer">
                <Eye /> عرض الصفحة
              </a>
            </Button>
            <Button type="submit" disabled={saving || !dirty}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              حفظ الصفحة
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

        <TabsContent value="general">
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Section title="عنوان الصفحة" description="يظهر في مسار التنقل وقائمة الصفحات.">
              <Field label="العنوان (عربي)" required error={errors.titleAr}>
                <TextInput {...bind('titleAr')} maxLength={255} />
              </Field>
              <Field label="العنوان (إنجليزي)" required error={errors.titleEn}>
                <TextInput {...bind('titleEn')} dir="ltr" maxLength={255} />
              </Field>
              <Field
                label="حالة النشر"
                hint="الصفحة غير المنشورة يعرضها الموقع بمحتواه الافتراضي."
                error={errors.status}
              >
                <Select
                  value={state.status}
                  onChange={(e) => update({ status: e.target.value as PublishStatus })}
                >
                  {PUBLISH_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {publishMeta[value].label}
                    </option>
                  ))}
                </Select>
              </Field>
            </Section>

            <Section
              title="محركات البحث"
              description="عنوان الصفحة ووصفها في نتائج البحث وعند المشاركة. الفارغ يستخدم النص الافتراضي."
            >
              <Field
                label="عنوان SEO (عربي)"
                counter={[state.metaTitleAr.length, 60]}
                error={errors.metaTitleAr}
              >
                <TextInput {...bind('metaTitleAr')} maxLength={255} />
              </Field>
              <Field
                label="عنوان SEO (إنجليزي)"
                counter={[state.metaTitleEn.length, 60]}
                error={errors.metaTitleEn}
              >
                <TextInput {...bind('metaTitleEn')} dir="ltr" maxLength={255} />
              </Field>
              <Field
                label="وصف SEO (عربي)"
                counter={[state.metaDescriptionAr.length, 160]}
                error={errors.metaDescriptionAr}
              >
                <TextArea {...bind('metaDescriptionAr')} maxLength={320} />
              </Field>
              <Field
                label="وصف SEO (إنجليزي)"
                counter={[state.metaDescriptionEn.length, 160]}
                error={errors.metaDescriptionEn}
              >
                <TextArea {...bind('metaDescriptionEn')} dir="ltr" maxLength={320} />
              </Field>
            </Section>

            <MediaSetting
              title="صورة المشاركة"
              description="تظهر عند مشاركة رابط الصفحة. الفارغ يستخدم صورة الموقع الافتراضية."
              emptyHint="المقاس المقترح 1200 × 630."
              previewClassName="h-28 w-52"
              value={state.ogImage}
              onChange={(ogImage) => update({ ogImage })}
              error={errors.ogImageId}
            />
          </div>
        </TabsContent>

        <TabsContent value="sections">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                الأقسام بترتيب ظهورها في الصفحة. الواجهة الرئيسية ظاهرة دائمًا.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setExpanded((current) =>
                      current.size > 0 ? new Set() : new Set(state.sections.map((s) => s.id)),
                    )
                  }
                >
                  {expanded.size > 0 ? 'طي الكل' : 'فتح الكل'}
                </Button>
              </div>
            </div>

            {state.sections.map((draft, index) => (
              <SectionCard
                key={draft.id}
                draft={draft}
                schema={sectionSchema(draft.type, page.slug)}
                index={index}
                count={state.sections.length}
                locked={page.requiredSectionTypes.includes(draft.type)}
                expanded={expanded.has(draft.id)}
                errors={errors}
                dirty={baseSections.get(draft.id) !== JSON.stringify(draft)}
                onToggle={() => toggle(draft.id)}
                onMove={(to) => moveSection(index, to)}
                onChange={updateSection}
                mediaOf={(id) => (typeof id === 'string' ? (media[id] ?? null) : null)}
                remember={(item: MediaSummary) => setMedia((m) => ({ ...m, [item.id]: item }))}
              />
            ))}

            {missingTypes.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-4">
                <span className="text-sm text-muted-foreground">إضافة قسم:</span>
                <Select
                  aria-label="نوع القسم"
                  className="w-auto min-w-48"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as SectionType | '')}
                >
                  <option value="">اختر القسم…</option>
                  {missingTypes.map((type) => (
                    <option key={type} value={type}>
                      {sectionLabel(type)}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!newType || adding}
                  onClick={() => void addSection()}
                >
                  {adding ? <Loader2 className="animate-spin" /> : <Plus />} إضافة
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Section
            title="معاينة الصفحة"
            description="تفتح الصفحة كما تظهر للزوار. تظهر التغييرات المحفوظة خلال لحظات."
          >
            {dirty && (
              <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm">
                لديك تغييرات غير محفوظة — احفظها أولًا لتظهر في المعاينة.
              </p>
            )}
            {page.status !== 'PUBLISHED' && (
              <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                الصفحة غير منشورة، لذا يعرض الموقع محتواه الافتراضي.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href={siteUrl('ar')} target="_blank" rel="noreferrer">
                  <Eye /> عرض الصفحة (عربي)
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={siteUrl('en')} target="_blank" rel="noreferrer">
                  <Eye /> View page (English)
                </a>
              </Button>
            </div>
          </Section>
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
                حفظ الصفحة
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => !open && blocker.reset?.()}
        title="مغادرة دون حفظ؟"
        description="لديك تغييرات غير محفوظة في هذه الصفحة وستفقدها إذا غادرت."
        confirmLabel="مغادرة دون حفظ"
        onConfirm={() => void blocker.proceed?.()}
      />
    </form>
  );
}
