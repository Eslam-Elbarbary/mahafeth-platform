import { ArrowDown, ArrowUp, ChevronDown, Lock } from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Select, TextArea, TextInput } from '@/components/ui/form-controls';
import { Repeater } from '@/components/ui/repeater';
import { Switch } from '@/components/ui/switch';
import { MediaSetting } from '@/features/media/media-setting';
import type { MediaSummary } from '@/features/media/types';
import { cn } from '@/lib/utils';

import {
  type FieldErrors,
  newRow,
  type Row,
  sectionErrorKey,
  type SectionDraft,
} from './page-form-state';
import type {
  ButtonDef,
  FieldDef,
  ItemFieldDef,
  ListDef,
  SectionSchema,
  TextDef,
} from './section-schemas';

type Values = Record<string, unknown>;
type InlineFieldDef = Extract<ItemFieldDef, { kind: 'plain' | 'bool' | 'select' }>;

const str = (value: unknown) => (typeof value === 'string' ? value : '');
const asRow = (value: unknown): Values =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Values) : {};

/** `<key>Ar` / `<key>En` inputs side by side. */
function BilingualInputs({
  label,
  hint,
  multiline,
  max,
  values,
  keyName,
  onChange,
  errorOf,
}: {
  label: string;
  hint?: ReactNode;
  multiline?: boolean;
  max: number;
  values: Values;
  keyName: string;
  onChange: (patch: Values) => void;
  errorOf: (key: string) => string | undefined;
}) {
  const Control = multiline ? TextArea : TextInput;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(['Ar', 'En'] as const).map((suffix) => {
        const key = `${keyName}${suffix}`;
        return (
          <Field
            key={key}
            label={`${label} (${suffix === 'Ar' ? 'عربي' : 'إنجليزي'})`}
            hint={hint}
            error={errorOf(key)}
          >
            <Control
              value={str(values[key])}
              onChange={(event) => onChange({ [key]: event.target.value })}
              dir={suffix === 'Ar' ? 'rtl' : 'ltr'}
              maxLength={max}
              aria-invalid={errorOf(key) ? true : undefined}
            />
          </Field>
        );
      })}
    </div>
  );
}

function ButtonInputs({
  def,
  value,
  onChange,
  errorOf,
}: {
  def: ButtonDef;
  value: Values;
  onChange: (value: Values) => void;
  errorOf: (key: string) => string | undefined;
}) {
  return (
    <fieldset className="grid gap-4 rounded-lg border border-dashed p-4">
      <legend className="px-1 text-sm font-medium">{def.label}</legend>
      <BilingualInputs
        label="نص الزر"
        max={120}
        values={value}
        keyName="label"
        onChange={(patch) => onChange({ ...value, ...patch })}
        errorOf={errorOf}
      />
      {def.href && (
        <Field label="الرابط" hint={def.hint} error={errorOf('href')}>
          <TextInput
            value={str(value.href)}
            onChange={(event) => onChange({ ...value, href: event.target.value })}
            dir="ltr"
            maxLength={500}
            placeholder="/contact#interest"
            aria-invalid={errorOf('href') ? true : undefined}
          />
        </Field>
      )}
      {!def.href && def.hint && <p className="text-xs text-muted-foreground">{def.hint}</p>}
    </fieldset>
  );
}

function ListInputs({
  def,
  rows,
  onChange,
  errorOf,
  mediaOf,
  pickMedia,
}: {
  def: ListDef;
  rows: Row[];
  onChange: (rows: Row[]) => void;
  errorOf: (path: string) => string | undefined;
  mediaOf: (id: unknown) => MediaSummary | null;
  pickMedia: (media: MediaSummary | null) => string | null;
}) {
  const create = () => {
    const values: Values = {};
    for (const item of def.fields) {
      if (item.kind === 'select') {
        const used = new Set(rows.map((row) => row[item.key]));
        values[item.key] =
          item.options.find((o) => !used.has(o.value))?.value ?? item.options[0]?.value;
      }
    }
    return newRow(values);
  };

  return (
    <div className="grid gap-2">
      <Repeater<Row>
        title={def.label}
        description={def.hint}
        items={rows}
        onChange={onChange}
        create={create}
        addLabel={def.addLabel}
        emptyLabel="لا توجد عناصر — يعرض الموقع القائمة الافتراضية."
        max={def.max}
        renderItem={(row, index, patch) => (
          <ItemInputs
            fields={def.fields}
            row={row}
            patch={patch}
            errorOf={(key) => errorOf(`${index}.${key}`)}
            mediaOf={mediaOf}
            pickMedia={pickMedia}
          />
        )}
      />
      {errorOf('') && <p className="text-xs text-destructive">{errorOf('')}</p>}
    </div>
  );
}

function ItemInputs({
  fields,
  row,
  patch,
  errorOf,
  mediaOf,
  pickMedia,
}: {
  fields: ItemFieldDef[];
  row: Row;
  patch: (patch: Partial<Row>) => void;
  errorOf: (key: string) => string | undefined;
  mediaOf: (id: unknown) => MediaSummary | null;
  pickMedia: (media: MediaSummary | null) => string | null;
}) {
  const isInline = (f: ItemFieldDef): f is InlineFieldDef =>
    f.kind === 'plain' || f.kind === 'bool' || f.kind === 'select';
  const inline = fields.filter(isInline);
  const rest = fields.filter((f) => !isInline(f));
  return (
    <div className="grid gap-4">
      {inline.length > 0 && (
        <div className="flex flex-wrap items-end gap-4">
          {inline.map((item) => {
            if (item.kind === 'plain') {
              return (
                <Field
                  key={item.key}
                  label={item.label}
                  required
                  error={errorOf(item.key)}
                  className="w-40"
                >
                  <TextInput
                    value={str(row[item.key])}
                    onChange={(event) => patch({ [item.key]: event.target.value })}
                    dir="ltr"
                    maxLength={item.max}
                    placeholder={item.placeholder}
                    aria-invalid={errorOf(item.key) ? true : undefined}
                  />
                </Field>
              );
            }
            if (item.kind === 'select') {
              return (
                <Field key={item.key} label={item.label} error={errorOf(item.key)} className="w-48">
                  <Select
                    value={str(row[item.key])}
                    onChange={(event) => patch({ [item.key]: event.target.value })}
                  >
                    {item.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              );
            }
            return (
              <label key={item.key} className="flex h-9 items-center gap-2 text-sm">
                <Switch
                  checked={row[item.key] === true}
                  onCheckedChange={(checked) => patch({ [item.key]: checked })}
                />
                {item.label}
              </label>
            );
          })}
        </div>
      )}
      {rest.map((item) =>
        item.kind === 'text' ? (
          <BilingualInputs
            key={item.key}
            label={item.label}
            multiline={item.multiline}
            max={item.max}
            values={row}
            keyName={item.key}
            onChange={(values) => patch(values)}
            errorOf={errorOf}
          />
        ) : item.kind === 'media' ? (
          <MediaSetting
            key={item.key}
            bare
            title={item.label}
            description=""
            emptyHint="لم تُختر صورة."
            previewClassName="size-20"
            value={mediaOf(row[item.key])}
            onChange={(media) => patch({ [item.key]: pickMedia(media) })}
            error={errorOf(item.key)}
          />
        ) : null,
      )}
    </div>
  );
}

function FieldInputs({
  def,
  draft,
  setContent,
  errorOf,
  mediaOf,
  pickMedia,
}: {
  def: FieldDef;
  draft: SectionDraft;
  setContent: (patch: Values) => void;
  errorOf: (path: string) => string | undefined;
  mediaOf: (id: unknown) => MediaSummary | null;
  pickMedia: (media: MediaSummary | null) => string | null;
}) {
  const value = draft.content[def.key];
  const path = `content.${def.key}`;

  switch (def.kind) {
    case 'text':
      return (
        <BilingualInputs
          label={def.label}
          hint={(def as TextDef).hint}
          multiline={def.multiline}
          max={def.max}
          values={draft.content}
          keyName={def.key}
          onChange={setContent}
          errorOf={(key) => errorOf(`content.${key}`)}
        />
      );
    case 'button':
      return (
        <ButtonInputs
          def={def}
          value={asRow(value)}
          onChange={(next) => setContent({ [def.key]: next })}
          errorOf={(key) => errorOf(`${path}.${key}`)}
        />
      );
    case 'media':
      return (
        <MediaSetting
          bare
          title={def.label}
          description=""
          emptyHint={def.hint ?? 'لم تُختر صورة.'}
          value={mediaOf(value)}
          onChange={(media) => setContent({ [def.key]: pickMedia(media) })}
          error={errorOf(path)}
        />
      );
    case 'mediaSlots': {
      const ids = Array.isArray(value) ? value : [];
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {def.labels.map((slotLabel, index) => (
            <MediaSetting
              key={slotLabel}
              bare
              title={slotLabel}
              description=""
              emptyHint="يعرض الموقع الصورة الافتراضية."
              value={mediaOf(ids[index])}
              onChange={(media) => {
                const next = def.labels.map((_, i) =>
                  i === index ? pickMedia(media) : (ids[i] ?? null),
                );
                setContent({ [def.key]: next });
              }}
              error={
                index === 0 ? (errorOf(path) ?? errorOf(`${path}.0`)) : errorOf(`${path}.${index}`)
              }
            />
          ))}
        </div>
      );
    }
    case 'number':
      return (
        <Field label={def.label} hint={def.hint} error={errorOf(path)} className="max-w-60">
          <TextInput
            value={value == null ? '' : String(value)}
            onChange={(event) => setContent({ [def.key]: event.target.value })}
            inputMode="decimal"
            dir="ltr"
            aria-invalid={errorOf(path) ? true : undefined}
          />
        </Field>
      );
    case 'list':
      return (
        <ListInputs
          def={def}
          rows={Array.isArray(value) ? (value as Row[]) : []}
          onChange={(rows) => setContent({ [def.key]: rows })}
          errorOf={(key) => errorOf(key ? `${path}.${key}` : path)}
          mediaOf={mediaOf}
          pickMedia={pickMedia}
        />
      );
  }
}

export function SectionCard({
  draft,
  schema,
  index,
  count,
  locked,
  expanded,
  errors,
  dirty,
  onToggle,
  onMove,
  onChange,
  mediaOf,
  remember,
}: {
  draft: SectionDraft;
  schema: SectionSchema;
  index: number;
  count: number;
  /** Required section: always visible. */
  locked: boolean;
  expanded: boolean;
  errors: FieldErrors;
  dirty: boolean;
  onToggle: () => void;
  onMove: (to: number) => void;
  onChange: (draft: SectionDraft) => void;
  /** Preview of a media id referenced in `content`. */
  mediaOf: (id: unknown) => MediaSummary | null;
  remember: (media: MediaSummary) => void;
}) {
  const errorOf = (path: string) => errors[sectionErrorKey(draft.id, path)];
  const hasErrors = Object.keys(errors).some(
    (key) => key.startsWith(`${draft.id}|`) && errors[key],
  );
  const heading = (draft.titleAr.split('\n')[0] ?? '').trim();

  const setContent = (patch: Values) =>
    onChange({ ...draft, content: { ...draft.content, ...patch } });
  /** Keeps the pick's preview and returns the id to store in `content`. */
  const pickMedia = (media: MediaSummary | null) => {
    if (media) remember(media);
    return media?.id ?? null;
  };

  return (
    <section
      className={cn(
        'rounded-xl border bg-card shadow-xs transition-opacity',
        !draft.visible && 'bg-muted/30',
        hasErrors && 'border-destructive/60',
      )}
    >
      <header className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
          {index + 1}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 text-start"
          aria-expanded={expanded}
        >
          <span className="grid min-w-0 gap-0.5">
            <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              {schema.label}
              {!draft.visible && <Badge tone="neutral">مخفي</Badge>}
              {dirty && <Badge tone="warning">غير محفوظ</Badge>}
              {hasErrors && <Badge tone="danger">يحتوي أخطاء</Badge>}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {heading || schema.description}
            </span>
          </span>
          <ChevronDown
            className={cn('ms-auto size-4 shrink-0 transition-transform', expanded && 'rotate-180')}
          />
        </button>
        <div className="flex items-center gap-1">
          <label className="me-2 flex items-center gap-2 text-xs text-muted-foreground">
            {locked ? <Lock className="size-3.5" /> : null}
            {locked ? 'ظاهر دائمًا' : draft.visible ? 'ظاهر' : 'مخفي'}
            <Switch
              checked={draft.visible}
              disabled={locked}
              onCheckedChange={(visible) => onChange({ ...draft, visible })}
              aria-label="إظهار القسم في الموقع"
            />
          </label>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={index === 0}
            aria-label="نقل لأعلى"
            onClick={() => onMove(index - 1)}
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={index === count - 1}
            aria-label="نقل لأسفل"
            onClick={() => onMove(index + 1)}
          >
            <ArrowDown />
          </Button>
        </div>
      </header>

      {expanded && (
        <div className="grid gap-5 border-t p-5">
          <p className="text-xs text-muted-foreground">
            {schema.description} الحقول الفارغة تعرض النص الافتراضي للموقع.
          </p>
          {schema.title && (
            <BilingualInputs
              label={schema.title.label}
              hint={schema.title.hint}
              multiline={schema.title.multiline}
              max={255}
              values={draft as unknown as Values}
              keyName="title"
              onChange={(patch) => onChange({ ...draft, ...patch })}
              errorOf={errorOf}
            />
          )}
          {schema.image && (
            <MediaSetting
              bare
              title={schema.image.label}
              description=""
              emptyHint={schema.image.hint ?? 'يعرض الموقع الصورة الافتراضية.'}
              previewClassName="h-28 w-44"
              value={draft.image}
              onChange={(image) => onChange({ ...draft, image })}
              error={errorOf('imageId')}
            />
          )}
          {schema.fields.map((def) => (
            <FieldInputs
              key={def.key}
              def={def}
              draft={draft}
              setContent={setContent}
              errorOf={errorOf}
              mediaOf={mediaOf}
              pickMedia={pickMedia}
            />
          ))}
        </div>
      )}
    </section>
  );
}
