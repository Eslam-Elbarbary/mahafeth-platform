import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  MapPin,
  MapPinOff,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import type { ChangeEvent } from 'react';

import { EmptyState } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Field, Section, Select, TextArea, TextInput } from '@/components/ui/form-controls';
import { Switch } from '@/components/ui/switch';
import { env } from '@/lib/env';
import { cn } from '@/lib/utils';

import {
  emptyFeature,
  type FeatureDraft,
  type FieldErrors,
  type FormState,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
  slugify,
} from './project-form-state';
import {
  featureIconLabels,
  KNOWN_CITIES,
  PROJECT_FEATURE_ICONS,
  PROJECT_STATUSES,
  PUBLISH_STATUSES,
  publishMeta,
  statusMeta,
} from './types';

export type TabProps = {
  state: FormState;
  update: (patch: Partial<FormState>) => void;
  errors: FieldErrors;
};

type TextKey = {
  [K in keyof FormState]: FormState[K] extends string ? K : never;
}[keyof FormState];

function binder({ state, update, errors }: TabProps) {
  return (key: TextKey) => ({
    value: state[key],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      update({ [key]: event.target.value } as Partial<FormState>),
    'aria-invalid': errors[key] ? true : undefined,
  });
}

const MAX_FEATURES = 24;

/* ------------------------------------------------------------------ General */

export function GeneralTab(props: TabProps) {
  const { state, update, errors } = props;
  const bind = binder(props);
  const cityOptions =
    state.city && !KNOWN_CITIES.some((c) => c.key === state.city)
      ? [...KNOWN_CITIES, { key: state.city, label: state.city }]
      : KNOWN_CITIES;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid gap-6">
        <Section title="بيانات المشروع" description="الاسم والرابط والمدينة كما تظهر في الموقع.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="اسم المشروع (عربي)" required error={errors.titleAr}>
              <TextInput {...bind('titleAr')} placeholder="محافظ الماسية" />
            </Field>
            <Field label="اسم المشروع (إنجليزي)" required error={errors.titleEn}>
              <TextInput {...bind('titleEn')} dir="ltr" placeholder="Mahafeth Diamond" />
            </Field>
            <Field
              label="الرابط المختصر"
              required
              hint={
                <>
                  يظهر في رابط الصفحة: <bdi dir="ltr">/projects/{state.slug || 'slug'}</bdi>
                </>
              }
              error={errors.slug}
            >
              <div className="flex gap-2">
                <TextInput {...bind('slug')} dir="ltr" placeholder="mahafeth-diamond" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  title="توليد من الاسم الإنجليزي"
                  aria-label="توليد من الاسم الإنجليزي"
                  disabled={!state.titleEn.trim()}
                  onClick={() => update({ slug: slugify(state.titleEn) })}
                >
                  <Wand2 />
                </Button>
              </div>
            </Field>
            <Field
              label="المدينة"
              required
              hint="تحدد موقع الدبوس في خريطة المشاريع."
              error={errors.city}
            >
              <Select {...bind('city')}>
                <option value="" disabled>
                  اختر المدينة
                </option>
                {cityOptions.map((city) => (
                  <option key={city.key} value={city.key}>
                    {city.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="الموقع (عربي)" hint="المدينة، الحي" error={errors.locationAr}>
              <TextInput {...bind('locationAr')} placeholder="جدة، حي الشاطئ" />
            </Field>
            <Field label="الموقع (إنجليزي)" error={errors.locationEn}>
              <TextInput {...bind('locationEn')} dir="ltr" placeholder="Jeddah, Al Shati" />
            </Field>
          </div>
        </Section>

        <Section title="الوصف" description="افصل بين فقرات الوصف بسطر فارغ.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="نبذة مختصرة (عربي)"
              counter={[state.summaryAr.length, 500]}
              error={errors.summaryAr}
            >
              <TextArea {...bind('summaryAr')} maxLength={500} />
            </Field>
            <Field
              label="نبذة مختصرة (إنجليزي)"
              counter={[state.summaryEn.length, 500]}
              error={errors.summaryEn}
            >
              <TextArea {...bind('summaryEn')} dir="ltr" maxLength={500} />
            </Field>
            <Field label="الوصف التفصيلي (عربي)" error={errors.descriptionAr}>
              <TextArea {...bind('descriptionAr')} className="min-h-48" />
            </Field>
            <Field label="الوصف التفصيلي (إنجليزي)" error={errors.descriptionEn}>
              <TextArea {...bind('descriptionEn')} dir="ltr" className="min-h-48" />
            </Field>
          </div>
        </Section>
      </div>

      <div className="grid gap-6 xl:sticky xl:top-36">
        <Section title="النشر">
          <Field label="حالة النشر" error={errors.publishStatus}>
            <div role="radiogroup" className="grid gap-2">
              {PUBLISH_STATUSES.map((status) => {
                const active = state.publishStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => update({ publishStatus: status })}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-start text-sm transition-colors hover:bg-muted/50 aria-checked:border-primary aria-checked:bg-primary/5"
                  >
                    <span
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded-full border-2',
                        active ? 'border-primary' : 'border-muted-foreground/40',
                      )}
                    >
                      {active && <span className="size-2 rounded-full bg-primary" />}
                    </span>
                    <span className="grid gap-0.5">
                      <span className="font-medium">{publishMeta[status].label}</span>
                      <span className="text-xs text-muted-foreground">
                        {status === 'PUBLISHED'
                          ? 'ظاهر للزوار في الموقع'
                          : status === 'DRAFT'
                            ? 'مخفي حتى يكتمل المحتوى'
                            : 'مخفي ومحفوظ للأرشيف'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>
          <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
            <span className="grid gap-0.5 text-sm">
              <span className="font-medium">مشروع مميز</span>
              <span className="text-xs text-muted-foreground">يظهر أولًا في الصفحة الرئيسية</span>
            </span>
            <Switch checked={state.featured} onCheckedChange={(featured) => update({ featured })} />
          </label>
          <Field label="ترتيب العرض" hint="الأصغر يظهر أولًا." error={errors.order}>
            <TextInput {...bind('order')} type="number" min={0} dir="ltr" />
          </Field>
        </Section>

        <Section title="حالة المشروع">
          <Field label="حالة البيع" error={errors.status}>
            <Select {...bind('status')}>
              {PROJECT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusMeta[status].label}
                </option>
              ))}
            </Select>
          </Field>
        </Section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Details */

export function DetailsTab(props: TabProps) {
  const { state, update, errors } = props;
  const bind = binder(props);

  const setFeature = (index: number, patch: Partial<FeatureDraft>) =>
    update({ features: state.features.map((f, i) => (i === index ? { ...f, ...patch } : f)) });

  const moveFeature = (index: number, step: -1 | 1) => {
    const next = [...state.features];
    const [item] = next.splice(index, 1);
    next.splice(index + step, 0, item!);
    update({ features: next });
  };

  return (
    <div className="grid gap-6">
      <Section title="أرقام المشروع" description="تظهر في شريط الحقائق أعلى صفحة المشروع.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="عدد الوحدات" error={errors.unitsCount}>
            <TextInput {...bind('unitsCount')} type="number" min={0} dir="ltr" placeholder="48" />
          </Field>
          <Field label="المساحة من (م²)" error={errors.sizeRange}>
            <TextInput {...bind('sizeMin')} type="number" min={1} dir="ltr" placeholder="120" />
          </Field>
          <Field label="المساحة إلى (م²)">
            <TextInput {...bind('sizeMax')} type="number" min={1} dir="ltr" placeholder="260" />
          </Field>
          <Field label="سنة التسليم" error={errors.completionYear}>
            <TextInput
              {...bind('completionYear')}
              type="number"
              min={1950}
              max={2100}
              dir="ltr"
              placeholder={String(new Date().getFullYear() + 1)}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="مميزات المشروع"
        description="مميزات خاصة بهذا المشروع. الضمانات العامة للشركة يضيفها الموقع تلقائيًا."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={state.features.length >= MAX_FEATURES}
            onClick={() => update({ features: [...state.features, { ...emptyFeature }] })}
          >
            <Plus /> إضافة ميزة
          </Button>
        }
      >
        {state.features.length === 0 ? (
          <EmptyState
            icon={<Sparkles />}
            title="لا توجد مميزات بعد"
            description="أضف مميزات مثل «تصميم عصري» أو «ضمانات هيكلية» لتظهر في صفحة المشروع."
          />
        ) : (
          <ol className="grid gap-3">
            {state.features.map((feature, index) => (
              <li key={index} className="grid gap-4 rounded-lg border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary tabular-nums">
                    {index + 1}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="نقل لأعلى"
                      disabled={index === 0}
                      onClick={() => moveFeature(index, -1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="نقل لأسفل"
                      disabled={index === state.features.length - 1}
                      onClick={() => moveFeature(index, 1)}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label="حذف الميزة"
                      onClick={() =>
                        update({ features: state.features.filter((_, i) => i !== index) })
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-[10rem_1fr_1fr]">
                  <Field label="الأيقونة">
                    <Select
                      value={feature.icon}
                      onChange={(e) =>
                        setFeature(index, { icon: e.target.value as FeatureDraft['icon'] })
                      }
                    >
                      {PROJECT_FEATURE_ICONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {featureIconLabels[icon]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="العنوان (عربي)" required error={errors[`features.${index}`]}>
                    <TextInput
                      value={feature.titleAr}
                      onChange={(e) => setFeature(index, { titleAr: e.target.value })}
                    />
                  </Field>
                  <Field label="العنوان (إنجليزي)" required>
                    <TextInput
                      dir="ltr"
                      value={feature.titleEn}
                      onChange={(e) => setFeature(index, { titleEn: e.target.value })}
                    />
                  </Field>
                  <Field label="النص (عربي)" className="md:col-start-2">
                    <TextArea
                      className="min-h-16"
                      value={feature.bodyAr}
                      onChange={(e) => setFeature(index, { bodyAr: e.target.value })}
                    />
                  </Field>
                  <Field label="النص (إنجليزي)">
                    <TextArea
                      dir="ltr"
                      className="min-h-16"
                      value={feature.bodyEn}
                      onChange={(e) => setFeature(index, { bodyEn: e.target.value })}
                    />
                  </Field>
                </div>
              </li>
            ))}
          </ol>
        )}
        {errors.features && <p className="text-xs text-destructive">{errors.features}</p>}
      </Section>
    </div>
  );
}

/* ----------------------------------------------------------------- Location */

function mapEmbedUrl(lat: number, lng: number) {
  const d = 0.01;
  const bbox = [lng - d, lat - d, lng + d, lat + d].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

export function LocationTab(props: TabProps) {
  const { state, errors } = props;
  const bind = binder(props);
  const lat = Number(state.latitude);
  const lng = Number(state.longitude);
  const valid =
    state.latitude.trim() !== '' &&
    state.longitude.trim() !== '' &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <Section
        title="الإحداثيات"
        description="تُستخدم لزر «الاتجاهات» في صفحة المشروع. انسخها من خرائط Google بالنقر بزر الفأرة الأيمن على الموقع."
      >
        <Field label="خط العرض (Latitude)" hint="مثال: 21.585" error={errors.latitude}>
          <TextInput
            {...bind('latitude')}
            type="number"
            step="0.000001"
            min={-90}
            max={90}
            dir="ltr"
          />
        </Field>
        <Field label="خط الطول (Longitude)" hint="مثال: 39.200" error={errors.longitude}>
          <TextInput
            {...bind('longitude')}
            type="number"
            step="0.000001"
            min={-180}
            max={180}
            dir="ltr"
          />
        </Field>
        {valid && (
          <Button asChild variant="outline" size="sm" className="justify-self-start">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink /> فتح في خرائط Google
            </a>
          </Button>
        )}
      </Section>

      <Section title="معاينة الموقع">
        {valid ? (
          <iframe
            title="معاينة الموقع على الخريطة"
            src={mapEmbedUrl(lat, lng)}
            className="aspect-[16/9] w-full rounded-lg border"
            loading="lazy"
          />
        ) : (
          <EmptyState
            icon={state.latitude || state.longitude ? <MapPinOff /> : <MapPin />}
            title="لا توجد إحداثيات"
            description="أدخل خط العرض وخط الطول لعرض الموقع على الخريطة."
          />
        )}
      </Section>
    </div>
  );
}

/* ---------------------------------------------------------------------- SEO */

export function SearchPreview({
  locale,
  title,
  description,
  slug,
  section = 'projects',
}: {
  locale: 'ar' | 'en';
  title: string;
  description: string;
  slug: string;
  /** Website route segment before the slug (`/ar/<section>/<slug>`). */
  section?: string;
}) {
  const url = `${env.siteUrl}/${locale}/${section}/${slug || 'slug'}`;
  const clip = (value: string, max: number) =>
    value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;

  return (
    <div
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className="grid gap-1 rounded-lg border bg-background p-4 font-[arial,sans-serif]"
    >
      <span className="truncate text-xs text-[#4d5156]" dir="ltr">
        {url.replace(/^https?:\/\//, '').replaceAll('/', ' › ')}
      </span>
      <span className="truncate text-lg leading-snug text-[#1a0dab]">
        {clip(title, SEO_TITLE_MAX + 5)}
      </span>
      <span className="line-clamp-2 text-sm text-[#4d5156]">
        {description ? (
          clip(description, SEO_DESCRIPTION_MAX + 10)
        ) : (
          <em className="text-muted-foreground">
            لا يوجد وصف — ستختار محركات البحث نصًا من الصفحة.
          </em>
        )}
      </span>
    </div>
  );
}

export function SeoTab(props: TabProps) {
  const { state, errors } = props;
  const bind = binder(props);
  const titleAr = state.metaTitleAr.trim() || state.titleAr.trim() || 'اسم المشروع';
  const titleEn = state.metaTitleEn.trim() || state.titleEn.trim() || 'Project name';
  const descAr = state.metaDescriptionAr.trim() || state.summaryAr.trim();
  const descEn = state.metaDescriptionEn.trim() || state.summaryEn.trim();

  return (
    <div className="grid gap-6">
      <Section
        title="محركات البحث (عربي)"
        description="اتركه فارغًا لاستخدام اسم المشروع والنبذة المختصرة."
      >
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="grid gap-4">
            <Field
              label="عنوان الصفحة"
              counter={[state.metaTitleAr.length, SEO_TITLE_MAX]}
              error={errors.metaTitleAr}
            >
              <TextInput {...bind('metaTitleAr')} maxLength={255} placeholder={state.titleAr} />
            </Field>
            <Field
              label="وصف الصفحة"
              counter={[state.metaDescriptionAr.length, SEO_DESCRIPTION_MAX]}
              error={errors.metaDescriptionAr}
            >
              <TextArea
                {...bind('metaDescriptionAr')}
                maxLength={500}
                placeholder={state.summaryAr}
              />
            </Field>
          </div>
          <div className="grid gap-2">
            <span className="text-xs font-medium text-muted-foreground">معاينة نتيجة البحث</span>
            <SearchPreview locale="ar" title={titleAr} description={descAr} slug={state.slug} />
          </div>
        </div>
      </Section>

      <Section title="محركات البحث (إنجليزي)">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="grid gap-4">
            <Field
              label="Meta title"
              counter={[state.metaTitleEn.length, SEO_TITLE_MAX]}
              error={errors.metaTitleEn}
            >
              <TextInput
                {...bind('metaTitleEn')}
                dir="ltr"
                maxLength={255}
                placeholder={state.titleEn}
              />
            </Field>
            <Field
              label="Meta description"
              counter={[state.metaDescriptionEn.length, SEO_DESCRIPTION_MAX]}
              error={errors.metaDescriptionEn}
            >
              <TextArea
                {...bind('metaDescriptionEn')}
                dir="ltr"
                maxLength={500}
                placeholder={state.summaryEn}
              />
            </Field>
          </div>
          <div className="grid gap-2">
            <span className="text-xs font-medium text-muted-foreground">معاينة نتيجة البحث</span>
            <SearchPreview locale="en" title={titleEn} description={descEn} slug={state.slug} />
          </div>
        </div>
      </Section>
    </div>
  );
}
