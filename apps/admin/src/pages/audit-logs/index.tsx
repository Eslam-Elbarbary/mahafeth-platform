import { ChevronDown, ExternalLink, FilterX, Globe, History, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { EmptyState, PageHeader, Skeleton } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, TextInput } from '@/components/ui/form-controls';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { type AuditLogQuery, auditLogsApi } from '@/features/audit-logs/api';
import { AuditChanges } from '@/features/audit-logs/audit-changes';
import { changedFields } from '@/features/audit-logs/audit-format';
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  actionMeta,
  entityMeta,
  REORDER_ENTITY_ID,
  type AuditAction,
  type AuditEntity,
  type AuditLog,
} from '@/features/audit-logs/types';
import { usersApi } from '@/features/users/api';
import { roleMeta } from '@/features/users/types';
import { formatDate, formatDateTime, formatNumber } from '@/lib/format';
import { useDebouncedValue } from '@/lib/hooks';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 25;
const FILTER_KEYS = ['q', 'entity', 'action', 'user', 'from', 'to', 'entityId'] as const;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const timeFormat = new Intl.DateTimeFormat('ar', {
  numberingSystem: 'latn',
  hour: 'numeric',
  minute: '2-digit',
});

/** Local calendar day of a timestamp, `YYYY-MM-DD`. */
function localDay(value: string | Date) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayHeading(day: string) {
  const today = localDay(new Date());
  const yesterday = localDay(new Date(Date.now() - 86_400_000));
  if (day === today) return 'اليوم';
  if (day === yesterday) return 'أمس';
  return formatDate(`${day}T12:00:00`);
}

function readQuery(params: URLSearchParams): AuditLogQuery {
  const entity = params.get('entity');
  const action = params.get('action');
  const from = params.get('from');
  const to = params.get('to');
  return {
    entity: AUDIT_ENTITIES.includes(entity as AuditEntity) ? (entity as AuditEntity) : undefined,
    action: AUDIT_ACTIONS.includes(action as AuditAction) ? (action as AuditAction) : undefined,
    userId: params.get('user') ?? undefined,
    entityId: params.get('entityId') ?? undefined,
    // Whole local days, inclusive.
    from: from && DAY.test(from) ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    to: to && DAY.test(to) ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
  };
}

function groupByDay(items: AuditLog[]) {
  const groups: Array<{ day: string; items: AuditLog[] }> = [];
  for (const item of items) {
    const day = localDay(item.createdAt);
    const last = groups.at(-1);
    if (last?.day === day) last.items.push(item);
    else groups.push({ day, items: [item] });
  }
  return groups;
}

function EntryTitle({ log }: { log: AuditLog }) {
  const entity = entityMeta[log.entity];
  const action = actionMeta[log.action];
  const label = log.entityLabel ?? log.entityId;
  if (log.entityId === REORDER_ENTITY_ID) {
    return (
      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
        <span className="font-semibold">{log.userName ?? 'زائر الموقع'}</span>
        <span className="text-muted-foreground">أعاد ترتيب</span>
        {log.href ? (
          <Link to={log.href} className="font-medium text-primary hover:underline">
            {entity.plural}
          </Link>
        ) : (
          <span className="font-medium">{entity.plural}</span>
        )}
        <Badge tone={action.tone}>{action.label}</Badge>
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
      <span className="font-semibold">{log.userName ?? 'زائر الموقع'}</span>
      <span className="text-muted-foreground">
        {log.userId === null && log.action === 'CREATE' ? 'أرسل' : action.verb} {entity.label}
      </span>
      {log.href ? (
        <Link to={log.href} className="font-medium text-primary hover:underline">
          {log.entity === 'settings' ? <code dir="ltr">{label}</code> : `«${label}»`}
        </Link>
      ) : (
        <span className="font-medium">
          {log.entity === 'settings' ? <code dir="ltr">{label}</code> : `«${label}»`}
        </span>
      )}
      <Badge tone={action.tone}>{action.label}</Badge>
    </span>
  );
}

function AuditEntry({
  log,
  expanded,
  onToggle,
}: {
  log: AuditLog;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = entityMeta[log.entity].icon;
  const count = changedFields(log).length;
  const tone = {
    CREATE: 'border-success/40 text-success',
    UPDATE: 'border-info/40 text-info',
    DELETE: 'border-destructive/40 text-destructive',
  }[log.action];

  return (
    <li
      data-audit-id={log.id}
      data-action={log.action}
      data-entity={log.entity}
      className="relative flex gap-3"
    >
      <span
        className={cn(
          'relative z-10 mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border-2 bg-background [&_svg]:size-4',
          tone,
        )}
      >
        <Icon />
      </span>
      <div className="grid min-w-0 flex-1 gap-2 rounded-lg border bg-background p-3 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <EntryTitle log={log} />
          <time
            dateTime={log.createdAt}
            title={formatDateTime(log.createdAt)}
            className="shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums"
          >
            {timeFormat.format(new Date(log.createdAt))}
          </time>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {log.userId ? (
            <>
              {log.userRole && <span>{roleMeta[log.userRole].label}</span>}
              {log.userEmail && <span dir="ltr">{log.userEmail}</span>}
            </>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Globe className="size-3" /> من نموذج الموقع
            </span>
          )}
          {log.ipAddress && (
            <span dir="ltr" className="tabular-nums">
              IP {log.ipAddress}
            </span>
          )}
          <Link
            to={`/audit-logs?entity=${log.entity}&entityId=${encodeURIComponent(log.entityId)}`}
            className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
          >
            <History className="size-3" />
            {log.entityId === REORDER_ENTITY_ID ? 'كل عمليات الترتيب' : 'سجل هذا العنصر'}
          </Link>
          {log.href && (
            <Link
              to={log.href}
              className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
            >
              <ExternalLink className="size-3" /> فتح
            </Link>
          )}
          {count > 0 && (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={onToggle}
              className="ms-auto inline-flex items-center gap-1 font-medium text-foreground hover:underline"
            >
              {log.action === 'UPDATE'
                ? `${formatNumber(count)} ${count === 1 ? 'حقل تغيّر' : 'حقول تغيّرت'}`
                : 'عرض البيانات'}
              <ChevronDown
                className={cn('size-3.5 transition-transform', expanded && 'rotate-180')}
              />
            </button>
          )}
        </div>
        {expanded && <AuditChanges log={log} />}
      </div>
    </li>
  );
}

export default function AuditLogsPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const q = useDebouncedValue(search.trim());
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

  const query: AuditLogQuery = {
    ...readQuery(params),
    q: q || undefined,
    page,
    pageSize: PAGE_SIZE,
  };
  const { data, error, loading } = useApiQuery(`audit-logs|${JSON.stringify(query)}`, () =>
    auditLogsApi.list(query),
  );
  const users = useApiQuery('audit-log-users', () => usersApi.list({ pageSize: 100 }));

  const hasFilters = FILTER_KEYS.some((key) => params.has(key)) || search !== '';
  const items = data?.data ?? [];

  function setParam(key: string, value: string | undefined) {
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        if (key !== 'page') copy.delete('page');
        if (value) copy.set(key, value);
        else copy.delete(key);
        return copy;
      },
      { replace: true },
    );
  }

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="سجل التغييرات"
        description="كل إضافة وتعديل وحذف على المحتوى والطلبات والإعدادات والمستخدمين: من قام به، ومتى، وما الذي تغيّر."
        actions={
          data && (
            <span className="text-sm text-muted-foreground">
              {formatNumber(data.meta.total)} عملية
            </span>
          )
        }
      />

      <div className="grid gap-3 rounded-xl border bg-background p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setParam('q', value.trim() || undefined);
            }}
            placeholder="ابحث باسم العنصر أو المستخدم…"
            className="min-w-56 flex-1"
          />
          <Select
            aria-label="القسم"
            className="w-auto min-w-40"
            value={query.entity ?? ''}
            onChange={(e) => setParam('entity', e.target.value || undefined)}
          >
            <option value="">كل الأقسام</option>
            {AUDIT_ENTITIES.map((entity) => (
              <option key={entity} value={entity}>
                {entityMeta[entity].plural}
              </option>
            ))}
          </Select>
          <Select
            aria-label="العملية"
            className="w-auto min-w-32"
            value={query.action ?? ''}
            onChange={(e) => setParam('action', e.target.value || undefined)}
          >
            <option value="">كل العمليات</option>
            {AUDIT_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {actionMeta[action].label}
              </option>
            ))}
          </Select>
          <Select
            aria-label="المستخدم"
            className="w-auto min-w-40"
            value={query.userId ?? ''}
            onChange={(e) => setParam('user', e.target.value || undefined)}
          >
            <option value="">كل المستخدمين</option>
            {users.data?.data.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-muted-foreground">من</span>
            <TextInput
              type="date"
              aria-label="من تاريخ"
              className="w-auto"
              value={params.get('from') ?? ''}
              max={params.get('to') ?? undefined}
              onChange={(e) => setParam('from', e.target.value || undefined)}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-muted-foreground">إلى</span>
            <TextInput
              type="date"
              aria-label="إلى تاريخ"
              className="w-auto"
              value={params.get('to') ?? ''}
              min={params.get('from') ?? undefined}
              onChange={(e) => setParam('to', e.target.value || undefined)}
            />
          </label>
          {query.entityId && (
            <Badge tone="dark" className="gap-2 py-1">
              سجل عنصر واحد
              <button
                type="button"
                aria-label="عرض كل العناصر"
                onClick={() => setParam('entityId', undefined)}
              >
                <X />
              </button>
            </Badge>
          )}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="ms-auto"
              onClick={() => {
                setSearch('');
                setParams({}, { replace: true });
              }}
            >
              <FilterX /> مسح الفلاتر
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive">
          {describeApiError(error)}
        </p>
      )}

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={<History />}
          title={hasFilters ? 'لا توجد عمليات مطابقة' : 'لا توجد عمليات مسجلة بعد'}
          description={
            hasFilters
              ? 'غيّر الفلاتر أو نطاق التاريخ.'
              : 'ستظهر هنا كل إضافة أو تعديل أو حذف يتم من لوحة التحكم.'
          }
        />
      ) : loading && items.length === 0 ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className={cn('grid gap-6', loading && 'opacity-60 transition-opacity')}>
          {groupByDay(items).map((group) => (
            <section key={group.day} className="grid gap-3" data-day={group.day}>
              <h3 className="sticky top-16 z-20 w-fit rounded-full border bg-background/95 px-3 py-1 text-xs font-semibold shadow-xs backdrop-blur">
                {dayHeading(group.day)}
              </h3>
              <ol className="relative grid gap-3">
                <span aria-hidden className="absolute inset-y-2 start-[17px] w-px bg-border" />
                {group.items.map((log) => (
                  <AuditEntry
                    key={log.id}
                    log={log}
                    expanded={expanded.has(log.id)}
                    onToggle={() => toggle(log.id)}
                  />
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}

      {data && data.meta.total > PAGE_SIZE && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data.meta.total}
          onPageChange={(next) => setParam('page', next > 1 ? String(next) : undefined)}
        />
      )}
    </div>
  );
}
