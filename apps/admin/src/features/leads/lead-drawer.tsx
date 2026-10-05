import { LoaderCircle, Mail, MessageCircle, Phone, Save, Trash2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link } from 'react-router';

import { Skeleton } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, Select, TextArea } from '@/components/ui/form-controls';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast-context';
import { cityLabel } from '@/features/projects/types';
import { ApiError } from '@/lib/api-client';
import { formatDateTime } from '@/lib/format';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';
import { cn } from '@/lib/utils';

import { leadsApi } from './api';
import { LeadStatusBadge } from './lead-badges';
import {
  LEAD_STATUSES,
  leadInterestLabels,
  leadSourceLabels,
  leadStatusMeta,
  type Lead,
  type LeadUpdateInput,
  type LeadUser,
} from './types';

const NOTES_MAX = 10_000;

/** `05xxxxxxxx` → `9665xxxxxxxx` for wa.me links. */
function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('05') ? `966${digits.slice(1)}` : digits;
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium break-words">{children ?? '—'}</dd>
    </div>
  );
}

function LeadDetails({
  lead,
  assignees,
  onUpdated,
  onDelete,
}: {
  lead: Lead;
  assignees: LeadUser[];
  onUpdated: (lead: Lead) => void;
  onDelete: () => void;
}) {
  const toast = useToast();
  const [notes, setNotes] = useState(lead.notes ?? '');
  const [saving, setSaving] = useState<keyof LeadUpdateInput | null>(null);
  const notesDirty = notes.trim() !== (lead.notes ?? '');

  async function save(field: keyof LeadUpdateInput, input: LeadUpdateInput, title: string) {
    setSaving(field);
    try {
      const updated = await leadsApi.update(lead.id, input);
      onUpdated(updated);
      toast({ title, description: updated.name });
    } catch (err) {
      toast({
        tone: 'error',
        title: 'تعذّر حفظ التغييرات',
        description: err instanceof ApiError ? describeApiError(err) : undefined,
      });
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <SheetBody>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`tel:${lead.phone}`}>
              <Phone /> اتصال
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a
              href={`https://wa.me/${whatsappNumber(lead.phone)}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle /> واتساب
            </a>
          </Button>
          {lead.email && (
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${lead.email}`}>
                <Mail /> بريد
              </a>
            </Button>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-4 rounded-xl border bg-muted/30 p-4">
          <Detail label="الجوال">
            <span dir="ltr">{lead.phone}</span>
          </Detail>
          <Detail label="البريد الإلكتروني">
            {lead.email && <span dir="ltr">{lead.email}</span>}
          </Detail>
          <Detail label="المدينة">{lead.city && cityLabel(lead.city)}</Detail>
          <Detail label="نوع الاهتمام">
            {lead.interestType && leadInterestLabels[lead.interestType]}
          </Detail>
          <Detail label="المشروع">
            {lead.project && (
              <Link to={`/projects/${lead.project.id}`} className="text-primary hover:underline">
                {lead.project.titleAr}
              </Link>
            )}
          </Detail>
          <Detail label="المصدر">{leadSourceLabels[lead.source]}</Detail>
          <Detail label="لغة الزائر">{lead.locale === 'ar' ? 'العربية' : 'English'}</Detail>
          <Detail label="تاريخ الطلب">{formatDateTime(lead.createdAt)}</Detail>
          {lead.message && (
            <div className="col-span-2">
              <Detail label="الرسالة">
                <span className="font-normal whitespace-pre-line">{lead.message}</span>
              </Detail>
            </div>
          )}
        </dl>

        <div className="grid gap-2">
          <span className="flex items-center gap-2 text-sm font-medium">
            الحالة
            {saving === 'status' && <LoaderCircle className="size-4 animate-spin" />}
          </span>
          <div role="group" aria-label="حالة الطلب" className="flex flex-wrap gap-2">
            {LEAD_STATUSES.map((status) => {
              const active = lead.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={active}
                  data-status={status}
                  disabled={saving !== null}
                  onClick={() => !active && void save('status', { status }, 'تم تحديث حالة الطلب')}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-60',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-accent',
                  )}
                >
                  {leadStatusMeta[status].label}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="المسؤول عن المتابعة">
          <Select
            value={lead.assignedToId ?? ''}
            disabled={saving !== null}
            onChange={(e) =>
              void save(
                'assignedToId',
                { assignedToId: e.target.value || null },
                'تم تحديث المسؤول',
              )
            }
          >
            <option value="">غير مسند</option>
            {assignees.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-2">
          <Field label="ملاحظات داخلية" counter={[notes.length, NOTES_MAX]}>
            <TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="سجل المكالمات والمتابعة…"
              className="min-h-32"
            />
          </Field>
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={!notesDirty || saving !== null || notes.length > NOTES_MAX}
              onClick={() =>
                void save('notes', { notes: notes.trim() || null }, 'تم حفظ الملاحظات')
              }
            >
              {saving === 'notes' ? <LoaderCircle className="animate-spin" /> : <Save />}
              حفظ الملاحظات
            </Button>
          </div>
        </div>
      </SheetBody>

      <SheetFooter className="justify-between">
        <span className="text-xs text-muted-foreground">
          آخر تحديث {formatDateTime(lead.updatedAt)}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 /> حذف الطلب
        </Button>
      </SheetFooter>
    </>
  );
}

/** Details drawer for one lead: status, assignee and notes editing plus delete. */
export function LeadDrawer({
  leadId,
  onClose,
  onUpdated,
  onDeleted,
}: {
  leadId: string | null;
  onClose: () => void;
  onUpdated: (lead: Lead) => void;
  onDeleted: (lead: Lead) => void;
}) {
  const toast = useToast();
  const {
    data: lead,
    error,
    mutate,
  } = useApiQuery(`lead|${leadId}`, () => (leadId ? leadsApi.get(leadId) : Promise.resolve(null)));
  const assignees = useApiQuery('lead-assignees', () => leadsApi.assignees());
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const current = lead && lead.id === leadId ? lead : null;

  async function confirmDelete() {
    if (!current) return;
    setDeleting(true);
    try {
      await leadsApi.remove(current.id);
      toast({ title: 'تم حذف الطلب', description: current.name });
      setConfirming(false);
      onDeleted(current);
    } catch (err) {
      toast({
        tone: 'error',
        title: 'تعذّر حذف الطلب',
        description: err instanceof ApiError ? describeApiError(err) : undefined,
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Sheet open={leadId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {current ? current.name : <Skeleton className="h-6 w-40" />}
            {current && <LeadStatusBadge status={current.status} />}
          </SheetTitle>
          <SheetDescription>تفاصيل طلب الاهتمام ومتابعته.</SheetDescription>
        </SheetHeader>

        {error && !current ? (
          <p className="m-5 rounded-md bg-destructive/5 p-3 text-sm text-destructive">
            {describeApiError(error)}
          </p>
        ) : current ? (
          <LeadDetails
            key={current.id}
            lead={current}
            assignees={assignees.data ?? []}
            onUpdated={(updated) => {
              mutate(() => updated);
              onUpdated(updated);
            }}
            onDelete={() => setConfirming(true)}
          />
        ) : (
          <SheetBody>
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-24 w-full" />
          </SheetBody>
        )}
      </SheetContent>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        busy={deleting}
        title="حذف الطلب؟"
        description={`سيُحذف طلب «${current?.name ?? ''}» من القائمة. يمكن استعادته من قاعدة البيانات فقط.`}
        onConfirm={() => void confirmDelete()}
      />
    </Sheet>
  );
}
