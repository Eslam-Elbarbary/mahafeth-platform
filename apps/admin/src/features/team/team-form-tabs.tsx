import { ImagePlus, RefreshCw, UserRound, X } from 'lucide-react';
import { type ChangeEvent, useState } from 'react';

import { EmptyState } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Field, Section, TextArea, TextInput } from '@/components/ui/form-controls';
import { Switch } from '@/components/ui/switch';
import { MediaPickerDialog } from '@/features/media/media-picker-dialog';

import { MemberPhoto } from './member-photo';
import type { FieldErrors, FormState } from './team-form-state';

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
        <Section
          title="بيانات العضو"
          description="الاسم والمنصب كما يظهران أسفل الكلمة في قسم «كلمة الإدارة»."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="الاسم (عربي)" required error={errors.nameAr}>
              <TextInput {...bind('nameAr')} maxLength={160} placeholder="سلطان البسامي" />
            </Field>
            <Field label="الاسم (إنجليزي)" required error={errors.nameEn}>
              <TextInput
                {...bind('nameEn')}
                dir="ltr"
                maxLength={160}
                placeholder="Sultan Al Bassami"
              />
            </Field>
            <Field label="المنصب (عربي)" required error={errors.positionAr}>
              <TextInput {...bind('positionAr')} maxLength={160} placeholder="رئيس مجلس الإدارة" />
            </Field>
            <Field label="المنصب (إنجليزي)" required error={errors.positionEn}>
              <TextInput
                {...bind('positionEn')}
                dir="ltr"
                maxLength={160}
                placeholder="Chairman of the Board"
              />
            </Field>
          </div>
        </Section>

        <Section
          title="الكلمة / النبذة"
          description="تظهر كلمة العضو في شريط «كلمة الإدارة» بالصفحة الرئيسية وصفحة القيادة. افصل بين الفقرات بسطر فارغ."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="النبذة (عربي)" error={errors.bioAr}>
              <TextArea {...bind('bioAr')} className="min-h-48" />
            </Field>
            <Field label="النبذة (إنجليزي)" error={errors.bioEn}>
              <TextArea {...bind('bioEn')} dir="ltr" className="min-h-48" />
            </Field>
          </div>
        </Section>
      </div>

      <div className="grid gap-6 xl:sticky xl:top-36">
        <Section title="العرض في الموقع">
          <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
            <span className="grid gap-0.5 text-sm">
              <span className="font-medium">ظاهر في الموقع</span>
              <span className="text-xs text-muted-foreground">أوقفه لإخفاء العضو دون حذفه</span>
            </span>
            <Switch checked={state.visible} onCheckedChange={(visible) => update({ visible })} />
          </label>
          <Field
            label="ترتيب العرض"
            hint="الأصغر يظهر أولًا في شريط كلمة الإدارة."
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

export function MediaTab({ state, update, errors }: TabProps) {
  const [picking, setPicking] = useState(false);
  const { photo } = state;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Section
        title="الصورة الشخصية"
        description="تظهر بجانب كلمة العضو في شريط «كلمة الإدارة». يُفضّل صورة مربعة بعرض 1080 بكسل على الأقل."
        actions={
          photo && (
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>
                <RefreshCw /> استبدال الصورة
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => update({ photo: null })}
              >
                <X /> إزالة
              </Button>
            </div>
          )
        }
      >
        {photo ? (
          <figure className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-end sm:gap-4">
            <MemberPhoto photo={photo} alt={state.nameAr} className="aspect-square w-64" />
            <figcaption className="text-xs text-muted-foreground">
              معاينة الصورة كما تُقص في الموقع.
              {photo.width && photo.height ? (
                <>
                  {' '}
                  الأبعاد الأصلية:{' '}
                  <bdi dir="ltr">
                    {photo.width} × {photo.height}
                  </bdi>
                </>
              ) : null}
            </figcaption>
          </figure>
        ) : (
          <EmptyState
            icon={<UserRound />}
            title="لا توجد صورة"
            description="بدون صورة يعرض الموقع صورة افتراضية بجانب كلمة العضو."
            action={
              <Button type="button" onClick={() => setPicking(true)}>
                <ImagePlus /> اختيار صورة
              </Button>
            }
          />
        )}
        {errors.photoId && <p className="text-xs text-destructive">{errors.photoId}</p>}
      </Section>

      <MediaPickerDialog
        open={picking}
        onOpenChange={setPicking}
        title="اختيار صورة العضو"
        confirmLabel="اعتماد الصورة"
        onSelect={([item]) => item && update({ photo: item })}
      />
    </div>
  );
}
