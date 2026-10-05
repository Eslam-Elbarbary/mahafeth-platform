import type { MediaSummary } from '@/features/media/types';
import { ApiError } from '@/lib/api-client';

import { sectionSchema } from './section-schemas';
import type {
  PageDetail,
  PageInput,
  PageSection,
  PublishStatus,
  SectionContent,
  SectionInput,
  SectionType,
} from './types';

/** List rows carry a local `rowId` (React key while reordering), stripped before saving. */
export type Row = Record<string, unknown> & { rowId: string };

export type SectionDraft = {
  id: string;
  type: SectionType;
  titleAr: string;
  titleEn: string;
  image: MediaSummary | null;
  visible: boolean;
  /** Content as stored, with list rows keyed; number fields may hold the typed string. */
  content: SectionContent;
};

export type PageFormState = {
  titleAr: string;
  titleEn: string;
  metaTitleAr: string;
  metaTitleEn: string;
  metaDescriptionAr: string;
  metaDescriptionEn: string;
  ogImage: MediaSummary | null;
  status: PublishStatus;
  sections: SectionDraft[];
};

/**
 * Page fields by name; section fields as `<sectionId>|<path>`, where `path` is `titleAr`,
 * `imageId` or `content.<key>[.<row>.<field>]` — the backend's own error keys.
 */
export type FieldErrors = Partial<Record<string, string>>;

export type EditorTab = 'general' | 'sections' | 'preview';

export const sectionErrorKey = (sectionId: string, path: string) => `${sectionId}|${path}`;

const isRow = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const rowId = () => crypto.randomUUID();

export const newRow = (values: Record<string, unknown> = {}): Row => ({
  ...values,
  rowId: rowId(),
});

export function toDraft(section: PageSection): SectionDraft {
  const content: SectionContent = {};
  for (const [key, value] of Object.entries(section.content ?? {})) {
    content[key] =
      Array.isArray(value) && value.every(isRow) ? value.map((row) => newRow(row)) : value;
  }
  return {
    id: section.id,
    type: section.type,
    titleAr: section.titleAr ?? '',
    titleEn: section.titleEn ?? '',
    image: section.image,
    visible: section.visible,
    content,
  };
}

/** Previews for every media id referenced inside section content. */
export const contentMediaOf = (page: PageDetail): Record<string, MediaSummary> =>
  Object.assign({}, ...page.sections.map((section) => section.media));

export function toState(page: PageDetail): PageFormState {
  return {
    titleAr: page.titleAr,
    titleEn: page.titleEn,
    metaTitleAr: page.metaTitleAr ?? '',
    metaTitleEn: page.metaTitleEn ?? '',
    metaDescriptionAr: page.metaDescriptionAr ?? '',
    metaDescriptionEn: page.metaDescriptionEn ?? '',
    ogImage: page.ogImage,
    status: page.status,
    sections: page.sections.map(toDraft),
  };
}

const text = (value: string) => value.trim() || null;
const REQUIRED = 'هذا الحقل مطلوب';

function pageInput(state: PageFormState): PageInput {
  return {
    titleAr: state.titleAr.trim(),
    titleEn: state.titleEn.trim(),
    metaTitleAr: text(state.metaTitleAr),
    metaTitleEn: text(state.metaTitleEn),
    metaDescriptionAr: text(state.metaDescriptionAr),
    metaDescriptionEn: text(state.metaDescriptionEn),
    ogImageId: state.ogImage?.id ?? null,
    status: state.status,
  };
}

/** Draft content → API content, collecting the checks the backend would reject anyway. */
function sectionInput(draft: SectionDraft, pageSlug: string, errors: FieldErrors): SectionInput {
  const content: SectionContent = { ...draft.content };
  const fail = (path: string, message: string) => {
    errors[sectionErrorKey(draft.id, path)] = message;
  };

  for (const field of sectionSchema(draft.type, pageSlug).fields) {
    const value = content[field.key];
    if (field.kind === 'number') {
      const raw = typeof value === 'string' ? value.trim() : value;
      if (raw === '' || raw == null) {
        content[field.key] = null;
      } else {
        const number = Number(raw);
        if (!Number.isFinite(number) || number < field.min || number > field.max) {
          fail(`content.${field.key}`, `رقم بين ${field.min} و ${field.max}`);
        } else {
          content[field.key] = number;
        }
      }
    } else if (field.kind === 'mediaSlots' && Array.isArray(value)) {
      const ids = [...value];
      while (ids.length > 0 && !ids[ids.length - 1]) ids.pop();
      if (ids.some((id) => !id)) fail(`content.${field.key}`, 'اختر الصورة الرئيسية أولًا');
      content[field.key] = ids;
    } else if (field.kind === 'list' && Array.isArray(value)) {
      const rows = value as Row[];
      rows.forEach((row, index) => {
        for (const item of field.fields) {
          if (item.kind !== 'plain') continue;
          const cell = typeof row[item.key] === 'string' ? (row[item.key] as string).trim() : '';
          const path = `content.${field.key}.${index}.${item.key}`;
          if (!cell) fail(path, REQUIRED);
          else if (item.pattern && !item.pattern.regex.test(cell)) fail(path, item.pattern.message);
        }
      });
      const keyField = field.fields.find((item) => item.kind === 'select');
      if (keyField) {
        const keys = rows.map((row) => row[keyField.key]);
        if (new Set(keys).size !== keys.length) {
          fail(`content.${field.key}`, 'كل مسار يظهر مرة واحدة فقط');
        }
      }
      content[field.key] = rows.map(({ rowId: _rowId, ...row }) => row);
    }
  }

  return {
    titleAr: text(draft.titleAr),
    titleEn: text(draft.titleEn),
    imageId: draft.image?.id ?? null,
    visible: draft.visible,
    content,
  };
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export type SavePlan = {
  page?: PageInput;
  sections: Array<{ id: string; input: SectionInput }>;
  /** New section order, when it changed. */
  order?: string[];
};

/** What changed since `baseline`, or the field errors that block saving. */
export function toSavePlan(
  state: PageFormState,
  baseline: PageFormState,
  pageSlug: string,
): { plan?: SavePlan; errors: FieldErrors } {
  const errors: FieldErrors = {};
  if (!state.titleAr.trim()) errors.titleAr = REQUIRED;
  if (!state.titleEn.trim()) errors.titleEn = REQUIRED;

  const { sections: _s, ...pageFields } = state;
  const { sections: _b, ...basePageFields } = baseline;
  const page = same(pageFields, basePageFields) ? undefined : pageInput(state);

  const before = new Map(baseline.sections.map((section) => [section.id, section]));
  const sections = state.sections
    .filter((draft) => !same(draft, before.get(draft.id)))
    .map((draft) => ({ id: draft.id, input: sectionInput(draft, pageSlug, errors) }));

  const ids = state.sections.map((section) => section.id);
  const order = same(
    ids,
    baseline.sections.map((section) => section.id),
  )
    ? undefined
    : ids;

  if (Object.keys(errors).length > 0) return { errors };
  return { errors, plan: { page, sections, order } };
}

export const tabOfField = (key: string): EditorTab => (key.includes('|') ? 'sections' : 'general');

export function tabsWithErrors(errors: FieldErrors) {
  return new Set(
    Object.entries(errors)
      .filter(([, message]) => message)
      .map(([key]) => tabOfField(key)),
  );
}

type Flattened = { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> };

/** Backend validation errors → first message per field, optionally scoped to a section. */
export function fieldErrorsOf(err: unknown, sectionId?: string): FieldErrors {
  if (!(err instanceof ApiError) || err.code !== 'VALIDATION_ERROR') return {};
  const details = err.details as Flattened | undefined;
  return Object.fromEntries(
    Object.entries(details?.fieldErrors ?? {}).map(([key, messages]) => [
      sectionId ? sectionErrorKey(sectionId, key) : key,
      messages?.[0],
    ]),
  );
}
