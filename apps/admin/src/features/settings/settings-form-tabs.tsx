import type { ChangeEvent } from 'react';

import { Field, Section, TextArea, TextInput } from '@/components/ui/form-controls';
import { Repeater } from '@/components/ui/repeater';
import { MediaSetting } from '@/features/media/media-setting';

import {
  type BranchRow,
  emptyBranch,
  emptyLegalLink,
  type FieldErrors,
  type FormState,
  type LegalLinkRow,
} from './settings-form-state';

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

/* ---------------------------------------------------------------- Branding */

export function BrandingTab(props: TabProps) {
  const { state, update, errors } = props;
  const bind = binder(props);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Section
        title="اسم الشركة"
        description="يظهر في تذييل الموقع ونصوص الشعار البديلة، ويُستخدم اسمًا للموقع في عناوين الصفحات."
        className="lg:col-span-2"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="اسم الشركة (عربي)" required error={errors.companyNameAr}>
            <TextInput {...bind('companyNameAr')} maxLength={160} />
          </Field>
          <Field label="اسم الشركة (إنجليزي)" required error={errors.companyNameEn}>
            <TextInput {...bind('companyNameEn')} dir="ltr" maxLength={160} />
          </Field>
        </div>
      </Section>
      <MediaSetting
        title="الشعار"
        description="يظهر في رأس الصفحة والتذييل وشاشة الانتقال بين الصفحات. يُفضّل PNG شفاف مربع (512 بكسل)."
        value={state.logo}
        onChange={(logo) => update({ logo })}
        error={errors.logo}
        emptyHint="بدون شعار يعرض الموقع الشعار الافتراضي."
      />
      <MediaSetting
        title="أيقونة المتصفح (Favicon)"
        description="تظهر في تبويب المتصفح. صورة مربعة PNG بمقاس 192 بكسل أو أكبر."
        value={state.favicon}
        onChange={(favicon) => update({ favicon })}
        error={errors.favicon}
        emptyHint="بدون أيقونة يعرض الموقع الأيقونة الافتراضية."
        previewClassName="size-20"
      />
    </div>
  );
}

/* ----------------------------------------------------------------- Contact */

export function ContactTab(props: TabProps) {
  const { state, update, errors } = props;
  const bind = binder(props);

  return (
    <div className="grid gap-6">
      <Section
        title="بيانات التواصل"
        description="الرقم الموحد يظهر في رأس الصفحة والتذييل، ورقم الواتساب في زر التواصل العائم."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="الرقم الموحد" required error={errors.phone} hint="مثال: 920019105">
            <TextInput {...bind('phone')} dir="ltr" inputMode="tel" maxLength={20} />
          </Field>
          <Field
            label="رقم الواتساب"
            required
            error={errors.whatsapp}
            hint="برمز الدولة وبدون + (مثال: 966507531002)"
          >
            <TextInput {...bind('whatsapp')} dir="ltr" inputMode="numeric" maxLength={20} />
          </Field>
          <Field label="البريد الإلكتروني" error={errors.email}>
            <TextInput {...bind('email')} dir="ltr" type="email" maxLength={160} />
          </Field>
        </div>
      </Section>

      <Repeater<BranchRow>
        title="الفروع"
        description="تظهر في تذييل الموقع بصيغة «المدينة — العنوان» وبنفس الترتيب."
        items={state.branches}
        onChange={(branches) => update({ branches })}
        create={emptyBranch}
        addLabel="إضافة فرع"
        emptyLabel="لا توجد فروع. أضف فرعًا ليظهر في التذييل."
        renderItem={(branch, i, patch) => {
          const err = (field: string) => errors[`branches.${i}.${field}`];
          return (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Field label="المدينة (عربي)" required error={err('cityAr')}>
                <TextInput
                  value={branch.cityAr}
                  maxLength={80}
                  aria-invalid={err('cityAr') ? true : undefined}
                  onChange={(e) => patch({ cityAr: e.target.value })}
                />
              </Field>
              <Field label="المدينة (إنجليزي)" required error={err('cityEn')}>
                <TextInput
                  value={branch.cityEn}
                  dir="ltr"
                  maxLength={80}
                  aria-invalid={err('cityEn') ? true : undefined}
                  onChange={(e) => patch({ cityEn: e.target.value })}
                />
              </Field>
              <Field label="العنوان (عربي)" error={err('addressAr')}>
                <TextInput
                  value={branch.addressAr}
                  maxLength={200}
                  onChange={(e) => patch({ addressAr: e.target.value })}
                />
              </Field>
              <Field label="العنوان (إنجليزي)" error={err('addressEn')}>
                <TextInput
                  value={branch.addressEn}
                  dir="ltr"
                  maxLength={200}
                  onChange={(e) => patch({ addressEn: e.target.value })}
                />
              </Field>
              <Field label="هاتف الفرع" error={err('phone')}>
                <TextInput
                  value={branch.phone}
                  dir="ltr"
                  inputMode="tel"
                  maxLength={20}
                  aria-invalid={err('phone') ? true : undefined}
                  onChange={(e) => patch({ phone: e.target.value })}
                />
              </Field>
            </div>
          );
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ Social */

const NETWORKS: Array<{
  key: 'instagram' | 'linkedin' | 'twitter' | 'snapchat';
  label: string;
  placeholder: string;
}> = [
  { key: 'instagram', label: 'إنستغرام', placeholder: 'https://instagram.com/…' },
  { key: 'linkedin', label: 'لينكدإن', placeholder: 'https://linkedin.com/company/…' },
  { key: 'twitter', label: 'إكس (تويتر)', placeholder: 'https://x.com/…' },
  { key: 'snapchat', label: 'سناب شات', placeholder: 'https://snapchat.com/add/…' },
];

export function SocialTab(props: TabProps) {
  const { errors } = props;
  const bind = binder(props);

  return (
    <Section
      title="حسابات التواصل الاجتماعي"
      description="روابط الأيقونات في تذييل الموقع. اترك الحقل فارغًا إن لم يكن للحساب رابط بعد."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {NETWORKS.map(({ key, label, placeholder }) => (
          <Field key={key} label={label} error={errors[key]}>
            <TextInput
              {...bind(key)}
              dir="ltr"
              type="url"
              maxLength={500}
              placeholder={placeholder}
            />
          </Field>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ Footer */

export function FooterTab({ state, update, errors }: TabProps) {
  return (
    <div className="grid gap-6">
      <Repeater<LegalLinkRow>
        title="الروابط القانونية"
        description="تظهر في الشريط السفلي من التذييل. سطر «تم التطوير بواسطة» ثابت ولا يُعدّل من هنا."
        items={state.legalLinks}
        onChange={(legalLinks) => update({ legalLinks })}
        create={emptyLegalLink}
        addLabel="إضافة رابط"
        emptyLabel="لا توجد روابط قانونية."
        renderItem={(link, i, patch) => {
          const err = (field: string) => errors[`legalLinks.${i}.${field}`];
          return (
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="العنوان (عربي)" required error={err('titleAr')}>
                <TextInput
                  value={link.titleAr}
                  maxLength={80}
                  aria-invalid={err('titleAr') ? true : undefined}
                  onChange={(e) => patch({ titleAr: e.target.value })}
                />
              </Field>
              <Field label="العنوان (إنجليزي)" required error={err('titleEn')}>
                <TextInput
                  value={link.titleEn}
                  dir="ltr"
                  maxLength={80}
                  aria-invalid={err('titleEn') ? true : undefined}
                  onChange={(e) => patch({ titleEn: e.target.value })}
                />
              </Field>
              <Field label="الرابط" error={err('url')} hint="https://… أو /privacy أو #">
                <TextInput
                  value={link.url}
                  dir="ltr"
                  maxLength={500}
                  aria-invalid={err('url') ? true : undefined}
                  onChange={(e) => patch({ url: e.target.value })}
                />
              </Field>
            </div>
          );
        }}
      />
    </div>
  );
}

/* --------------------------------------------------------------------- SEO */

export function SeoTab(props: TabProps) {
  const { state, update, errors } = props;
  const bind = binder(props);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Section
        title="بيانات محركات البحث الافتراضية"
        description="العنوان والوصف للصفحة الرئيسية ولأي صفحة ليس لها بيانات خاصة."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="العنوان (عربي)"
            error={errors.seoTitleAr}
            counter={[state.seoTitleAr.length, 60]}
          >
            <TextInput {...bind('seoTitleAr')} maxLength={160} />
          </Field>
          <Field
            label="العنوان (إنجليزي)"
            error={errors.seoTitleEn}
            counter={[state.seoTitleEn.length, 60]}
          >
            <TextInput {...bind('seoTitleEn')} dir="ltr" maxLength={160} />
          </Field>
          <Field
            label="الوصف (عربي)"
            error={errors.seoDescriptionAr}
            counter={[state.seoDescriptionAr.length, 160]}
          >
            <TextArea {...bind('seoDescriptionAr')} maxLength={500} />
          </Field>
          <Field
            label="الوصف (إنجليزي)"
            error={errors.seoDescriptionEn}
            counter={[state.seoDescriptionEn.length, 160]}
          >
            <TextArea {...bind('seoDescriptionEn')} dir="ltr" maxLength={500} />
          </Field>
        </div>
      </Section>
      <MediaSetting
        title="صورة المشاركة (OG Image)"
        description="تظهر عند مشاركة روابط الموقع في وسائل التواصل. المقاس المثالي 1200 × 630 بكسل."
        value={state.ogImage}
        onChange={(ogImage) => update({ ogImage })}
        error={errors.ogImage}
        emptyHint="بدون صورة تُستخدم صور الصفحات عند توفرها."
        previewClassName="aspect-[1200/630] w-full max-w-72"
      />
    </div>
  );
}
