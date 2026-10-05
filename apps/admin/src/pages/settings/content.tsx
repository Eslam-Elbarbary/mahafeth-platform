import {
  ExternalLink,
  FormInput,
  Languages,
  Loader2,
  Menu,
  MousePointerClick,
  PanelTop,
  Save,
  Tags,
} from 'lucide-react';
import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import { useBlocker, useSearchParams } from 'react-router';

import { EmptyState, PageHeader, Skeleton } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, Section, TextArea, TextInput } from '@/components/ui/form-controls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast-context';
import { mediaApi } from '@/features/media/api';
import { MediaSetting } from '@/features/media/media-setting';
import type { MediaSummary } from '@/features/media/types';
import { settingsApi } from '@/features/settings/api';
import {
  CONTENT_KEYS,
  type ContentField,
  type ContentKey,
  type ContentTab,
} from '@/features/settings/global-content-fields';
import {
  type ContentErrors,
  contentErrorsOf,
  contentMediaIds,
  type ContentState,
  errorKey,
  LANGS,
  tabOfError,
  tabsWithErrors,
  toContentInput,
  toContentState,
} from '@/features/settings/global-content-state';
import { ApiError } from '@/lib/api-client';
import { env } from '@/lib/env';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';

const TABS: Array<{ value: ContentTab; label: string; icon: typeof Menu }> = [
  { value: 'navigation', label: 'القوائم والتذييل', icon: Menu },
  { value: 'forms', label: 'النماذج', icon: FormInput },
  { value: 'buttons', label: 'الأزرار', icon: MousePointerClick },
  { value: 'labels', label: 'نصوص عامة', icon: Tags },
  { value: 'headers', label: 'رؤوس الصفحات', icon: PanelTop },
];
const isTab = (value: string | null): value is ContentTab => TABS.some((t) => t.value === value);

/** Content settings plus the header images they reference; a deleted image loads as empty. */
async function loadContent() {
  const settings = await settingsApi.list();
  const media = await Promise.all(
    contentMediaIds(settings).map((id) => mediaApi.get(id).catch(() => null)),
  );
  const byId = new Map<string, MediaSummary>();
  for (const item of media) if (item) byId.set(item.id, item);
  return toContentState(settings, byId);
}

export default function GlobalContentPage() {
  const { data, error, reload } = useApiQuery('settings:content', loadContent);

  if (error && !data) {
    return (
      <EmptyState
        icon={<Languages />}
        title="تعذّر تحميل المحتوى العام"
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
  return <ContentEditor initial={data} />;
}

function ContentEditor({ initial }: { initial: ContentState }) {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab: ContentTab = isTab(tabParam) ? tabParam : 'navigation';

  const [baseline, setBaseline] = useState(initial);
  const [state, setState] = useState(initial);
  const [errors, setErrors] = useState<ContentErrors>({});
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
        if (next === 'navigation') copy.delete('tab');
        else copy.set('tab', next);
        return copy;
      },
      { replace: true },
    );
  }

  function clearError(id: string) {
    setErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function setText(key: string, prop: string, text: string) {
    setState((s) => ({ ...s, values: { ...s.values, [key]: { ...s.values[key], [prop]: text } } }));
    clearError(errorKey(key, prop));
  }

  function setImage(key: string, media: MediaSummary | null) {
    setState((s) => ({ ...s, images: { ...s.images, [key]: media } }));
    clearError(errorKey(key, 'imageId'));
  }

  function reportErrors(found: ContentErrors) {
    setErrors(found);
    const first = Object.keys(found).find((key) => found[key]);
    if (first && !tabsWithErrors(found).has(tab)) setTab(tabOfError(first));
    toast({
      tone: 'error',
      title: 'تحقق من الحقول',
      description: 'بعض الحقول تحتاج إلى تصحيح قبل الحفظ.',
    });
  }

  async function save(event?: FormEvent) {
    event?.preventDefault();
    const { items, next, errors: found } = toContentInput(state, baseline);
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
      toast({
        title: 'تم حفظ المحتوى العام',
        description: 'ستظهر التغييرات في الموقع خلال لحظات.',
      });
    } catch (err) {
      const fieldErrors = contentErrorsOf(err);
      if (Object.keys(fieldErrors).length > 0) return reportErrors(fieldErrors);
      toast({
        tone: 'error',
        title: 'تعذّر حفظ المحتوى العام',
        description: err instanceof ApiError ? describeApiError(err) : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-6 pb-24" onSubmit={(e) => void save(e)} noValidate>
      <PageHeader
        title="المحتوى العام"
        description="نصوص القوائم والتذييل والنماذج والأزرار ورؤوس صفحات المشاريع والخدمات والشركاء بالعربية والإنجليزية. الحقل الفارغ يعرض النص الافتراضي للموقع."
        actions={
          <>
            <Button asChild variant="outline">
              <a href={`${env.siteUrl}/ar`} target="_blank" rel="noreferrer">
                <ExternalLink /> عرض الموقع
              </a>
            </Button>
            <Button type="submit" disabled={saving || !dirty}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              حفظ المحتوى
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

        {TABS.map(({ value }) => (
          <TabsContent key={value} value={value} className="grid gap-6">
            {CONTENT_KEYS.filter((entry) => entry.tab === value).map((entry) => (
              <ContentKeyEditor
                key={entry.key}
                entry={entry}
                values={state.values[entry.key] ?? {}}
                image={state.images[entry.key] ?? null}
                errors={errors}
                onText={(prop, text) => setText(entry.key, prop, text)}
                onImage={(media) => setImage(entry.key, media)}
              />
            ))}
          </TabsContent>
        ))}
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
                حفظ المحتوى
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => !open && blocker.reset?.()}
        title="مغادرة دون حفظ؟"
        description="لديك تغييرات غير محفوظة في المحتوى العام وستفقدها إذا غادرت الصفحة."
        confirmLabel="مغادرة دون حفظ"
        onConfirm={() => blocker.proceed?.()}
      />
    </form>
  );
}

function ContentKeyEditor({
  entry,
  values,
  image,
  errors,
  onText,
  onImage,
}: {
  entry: ContentKey;
  values: Record<string, string>;
  image: MediaSummary | null;
  errors: ContentErrors;
  onText: (prop: string, text: string) => void;
  onImage: (media: MediaSummary | null) => void;
}) {
  return (
    <>
      {entry.groups.map((group, i) => (
        <Section key={group.title} title={group.title} description={group.description}>
          <div className="grid gap-x-4 gap-y-5">
            {group.fields.map((field) => (
              <BilingualField
                key={field.name}
                field={field}
                values={values}
                errorOf={(prop) => errors[errorKey(entry.key, prop)]}
                onText={onText}
              />
            ))}
          </div>
          {entry.image && i === entry.groups.length - 1 && (
            <div className="border-t pt-5">
              <MediaSetting
                bare
                title={entry.image.title}
                description={entry.image.description}
                value={image}
                onChange={onImage}
                error={errors[errorKey(entry.key, 'imageId')]}
                emptyHint={`${entry.image.description} بدون صورة تُعرض الصورة الافتراضية.`}
                previewClassName="aspect-video w-48"
              />
            </div>
          )}
        </Section>
      ))}
    </>
  );
}

function BilingualField({
  field,
  values,
  errorOf,
  onText,
}: {
  field: ContentField;
  values: Record<string, string>;
  errorOf: (prop: string) => string | undefined;
  onText: (prop: string, text: string) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {LANGS.map(({ suffix, label, dir }) => {
        const prop = `${field.name}${suffix}`;
        const value = values[prop] ?? '';
        const error = errorOf(prop);
        const control = {
          value,
          dir,
          maxLength: field.max,
          'aria-invalid': error ? true : undefined,
          onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            onText(prop, event.target.value),
        };
        return (
          <Field
            key={prop}
            label={`${field.label} (${label})`}
            hint={field.hint}
            error={error}
            counter={field.multiline ? [value.length, field.max] : undefined}
          >
            {field.multiline ? (
              <TextArea {...control} rows={field.maxLines ?? 3} />
            ) : (
              <TextInput {...control} />
            )}
          </Field>
        );
      })}
    </div>
  );
}
