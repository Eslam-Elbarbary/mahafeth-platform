import { cn } from '@/lib/utils';

import { changedFields, fieldLabel, formatValue, HIDDEN_FIELDS } from './audit-format';
import type { AuditEntity, AuditLog } from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function Value({
  entity,
  field,
  value,
  depth = 0,
}: {
  entity: AuditEntity;
  field: string;
  value: unknown;
  depth?: number;
}) {
  const text = formatValue(entity, field, value);
  if (text !== null) {
    return (
      <span className="block max-h-40 overflow-y-auto break-words whitespace-pre-line">{text}</span>
    );
  }
  if (depth === 0 && isRecord(value)) {
    const entries = Object.entries(value).filter(([key]) => !HIDDEN_FIELDS.has(key));
    return (
      <dl className="grid gap-1.5">
        {entries.map(([key, nested]) => (
          <div key={key} className="grid gap-0.5">
            <dt className="text-[11px] text-muted-foreground">{fieldLabel(key)}</dt>
            <dd>
              <Value entity={entity} field={key} value={nested} depth={depth + 1} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <pre
      dir="ltr"
      className="max-h-48 overflow-auto rounded-md bg-muted/60 p-2 text-start text-[11px] leading-relaxed break-all whitespace-pre-wrap"
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

/** Changed fields (before → after) of an update, or the record snapshot of a create/delete. */
export function AuditChanges({ log, className }: { log: AuditLog; className?: string }) {
  const fields = changedFields(log);
  if (fields.length === 0) {
    return <p className={cn('text-xs text-muted-foreground', className)}>لا توجد تفاصيل محفوظة.</p>;
  }
  const isUpdate = log.action === 'UPDATE';
  const snapshot = (log.action === 'DELETE' ? log.oldData : log.newData) ?? {};

  return (
    <div className={cn('overflow-x-auto rounded-lg border', className)}>
      <table className="w-full min-w-[520px] text-xs" data-audit-changes={log.id}>
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="w-40 px-3 py-2 text-start font-medium">الحقل</th>
            {isUpdate ? (
              <>
                <th className="px-3 py-2 text-start font-medium">قبل</th>
                <th className="px-3 py-2 text-start font-medium">بعد</th>
              </>
            ) : (
              <th className="px-3 py-2 text-start font-medium">
                {log.action === 'CREATE' ? 'القيمة' : 'القيمة قبل الحذف'}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field} data-field={field} className="border-t align-top">
              <th scope="row" className="px-3 py-2 text-start font-medium">
                {fieldLabel(field)}
              </th>
              {isUpdate ? (
                <>
                  <td className="bg-destructive/[0.03] px-3 py-2 text-muted-foreground" data-before>
                    <Value entity={log.entity} field={field} value={log.oldData?.[field]} />
                  </td>
                  <td className="bg-success/[0.04] px-3 py-2" data-after>
                    <Value entity={log.entity} field={field} value={log.newData?.[field]} />
                  </td>
                </>
              ) : (
                <td className="px-3 py-2">
                  <Value entity={log.entity} field={field} value={snapshot[field]} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
