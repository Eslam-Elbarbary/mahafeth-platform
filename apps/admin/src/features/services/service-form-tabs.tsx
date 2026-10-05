import { ImageOff, ImagePlus, RefreshCw, Wand2, X } from 'lucide-react';
import { type ChangeEvent, useState } from 'react';

import { EmptyState } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Field, Section, TextArea, TextInput } from '@/components/ui/form-controls';
import { MediaPickerDialog } from '@/features/media/media-picker-dialog';
import { SearchPreview } from '@/features/projects/project-form-tabs';
import { mediaSrc } from '@/lib/media-url';
import { cn } from '@/lib/utils';

import {
  type FieldErrors,
  type FormState,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
  slugify,
} from './service-form-state';
import { PUBLISH_STATUSES, publishMeta } from './types';

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
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      update({ [key]: event.target.value } as Partial<FormState>),
    'aria-invalid': errors[key] ? true : undefined,
  });
}

/* ------------------------------------------------------------------ General */

export function GeneralTab(props: TabProps) {
  const { state, update, errors } = props;
  const bind = binder(props);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid gap-6">
        <Section title="بيانات الخدمة" description="الاسم والرابط كما يظهران في الموقع والقوائم.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="اسم الخدمة (عربي)" required error={errors.titleAr}>
              <TextInput {...bind('titleAr')} placeholder="التسويق العقاري" />
            </Field>
            <Field label="اسم الخدمة (إنجليزي)" required error={errors.titleEn}>
              <TextInput {...bind('titleEn')} dir="ltr" placeholder="Real estate marketing" />
            </Field>
            <Field
              label="الرابط المختصر"
              required
              className="md:col-span-2"
              hint={
                <>
                  يظهر في رابط الصفحة: <bdi dir="ltr">/services/{state.slug || 'slug'}</bdi>
                </>
              }
              error={errors.slug}
            >
              <div className="flex gap-2">
                <TextInput {...bind('slug')} dir="ltr" placeholder="real-estate-marketing" />
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
          </div>
        </Section>

        <Section
          title="الوصف"
          description="النبذة تظهر في سطر الخدمة بقائمة الخدمات، والوصف عند فتحها وفي صفحة الخدمة. افصل بين الفقرات بسطر فارغ."
        >
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
          <Field label="حالة النشر" error={errors.status}>
            <div role="radiogroup" className="grid gap-2">
              {PUBLISH_STATUSES.map((status) => {
                const active = state.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => update({ status })}
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
                          ? 'ظاهرة للزوار في الموقع'
                          : status === 'DRAFT'
                            ? 'مخفية حتى يكتمل المحتوى'
                            : 'مخفية ومحفوظة للأرشيف'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>
          <Field
            label="ترتيب العرض"
            hint="الأصغر يظهر أولًا في قائمة الخدمات والقوائم."
            error={errors.order}
          >
            <TextInput {...bind('order')} type="number" min={0} dir="ltr" />
          </Field>
        </Section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- Media */

export function MediaTab(props: TabProps) {
  const { state, update, errors } = props;
  const bind = binder(props);
  const [picking, setPicking] = useState(false);
  const { image } = state;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Section
        title="صورة الخدمة"
        description="تظهر عند فتح الخدمة في قائمة الخدمات، وخلفية رأس صفحة الخدمة. يُفضّل صورة أفقية بعرض 1600 بكسل على الأقل."
        actions={
          image && (
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>
                <RefreshCw /> استبدال
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => update({ image: null })}
              >
                <X /> إزالة
              </Button>
            </div>
          )
        }
      >
        {image ? (
          <figure className="grid gap-2">
            <img
              src={mediaSrc(image.url)}
              alt={image.altAr ?? ''}
              className="aspect-[16/10] w-full rounded-lg border bg-muted object-cover"
            />
            <figcaption className="text-xs text-muted-foreground">
              {image.width && image.height ? (
                <bdi dir="ltr">
                  {image.width} × {image.height}
                </bdi>
              ) : null}
              {image.altAr && <> · {image.altAr}</>}
            </figcaption>
          </figure>
        ) : (
          <EmptyState
            icon={<ImageOff />}
            title="لا توجد صورة"
            description="بدون صورة يعرض الموقع الصورة الافتراضية للخدمة إن وُجدت."
            action={
              <Button type="button" onClick={() => setPicking(true)}>
                <ImagePlus /> اختيار صورة
              </Button>
            }
          />
        )}
        {errors.imageId && <p className="text-xs text-destructive">{errors.imageId}</p>}
      </Section>

      <Section title="الأيقونة" description="اسم أيقونة اختياري للاستخدام في تصاميم لاحقة.">
        <Field label="اسم الأيقونة" hint="أحرف إنجليزية صغيرة، مثل: key" error={errors.icon}>
          <TextInput {...bind('icon')} dir="ltr" maxLength={80} placeholder="key" />
        </Field>
      </Section>

      <MediaPickerDialog
        open={picking}
        onOpenChange={setPicking}
        title="اختيار صورة الخدمة"
        confirmLabel="اعتماد الصورة"
        onSelect={([item]) => item && update({ image: item })}
      />
    </div>
  );
}

/* ---------------------------------------------------------------------- SEO */

export function SeoTab(props: TabProps) {
  const { state, errors } = props;
  const bind = binder(props);
  const titleAr = state.metaTitleAr.trim() || state.titleAr.trim() || 'اسم الخدمة';
  const titleEn = state.metaTitleEn.trim() || state.titleEn.trim() || 'Service name';
  const descAr = state.metaDescriptionAr.trim() || state.summaryAr.trim();
  const descEn = state.metaDescriptionEn.trim() || state.summaryEn.trim();

  return (
    <div className="grid gap-6">
      <Section
        title="محركات البحث (عربي)"
        description="اتركه فارغًا لاستخدام اسم الخدمة والنبذة المختصرة."
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
            <SearchPreview
              locale="ar"
              section="services"
              title={titleAr}
              description={descAr}
              slug={state.slug}
            />
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
            <SearchPreview
              locale="en"
              section="services"
              title={titleEn}
              description={descEn}
              slug={state.slug}
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
