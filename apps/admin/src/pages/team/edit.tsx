import { ArrowRight, ExternalLink, FileText, Images, Loader2, Save, Trash2, Users } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router';

import { EmptyState, Skeleton } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast-context';
import { teamApi } from '@/features/team/api';
import {
  type EditorTab,
  fieldErrorsOf,
  type FieldErrors,
  type FormState,
  tabOfField,
  tabsWithErrors,
  toInput,
  toState,
} from '@/features/team/team-form-state';
import { GeneralTab, MediaTab } from '@/features/team/team-form-tabs';
import type { TeamMember } from '@/features/team/types';
import { ApiError } from '@/lib/api-client';
import { env } from '@/lib/env';
import { formatDate } from '@/lib/format';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';

const TABS: Array<{ value: EditorTab; label: string; icon: typeof FileText }> = [
  { value: 'general', label: 'المعلومات العامة', icon: FileText },
  { value: 'media', label: 'الوسائط', icon: Images },
];
const isTab = (value: string | null): value is EditorTab => TABS.some((t) => t.value === value);

export default function TeamMemberEditPage() {
  const { id = 'new' } = useParams();
  return id === 'new' ? <NewEditor /> : <LoadedEditor id={id} />;
}

function EditorSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

/** New members go to the end of the leadership track by default. */
function NewEditor() {
  const { data: nextOrder, error } = useApiQuery('team-next-order', () =>
    teamApi.list({ pageSize: 1 }).then((res) => res.meta.total),
  );
  if (nextOrder === undefined && !error) return <EditorSkeleton />;
  return <MemberEditor key="new" initial={null} nextOrder={nextOrder ?? 0} />;
}

function LoadedEditor({ id }: { id: string }) {
  const { data, error, reload } = useApiQuery(`team-member|${id}`, () => teamApi.get(id));

  if (error && !data) {
    return (
      <EmptyState
        icon={<Users />}
        title="تعذّر تحميل العضو"
        description={describeApiError(error)}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={reload}>
              إعادة المحاولة
            </Button>
            <Button asChild variant="ghost">
              <Link to="/team">العودة لفريق القيادة</Link>
            </Button>
          </div>
        }
      />
    );
  }
  if (!data || data.id !== id) return <EditorSkeleton />;
  return <MemberEditor key={data.id} initial={data} />;
}

function MemberEditor({
  initial,
  nextOrder = 0,
}: {
  initial: TeamMember | null;
  nextOrder?: number;
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab: EditorTab = isTab(tabParam) ? tabParam : 'general';

  const [member, setMember] = useState(initial);
  const [baseline, setBaseline] = useState(() => toState(initial ?? undefined, nextOrder));
  const [state, setState] = useState(baseline);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const skipGuard = useRef(false);

  const dirty = JSON.stringify(state) !== JSON.stringify(baseline);
  const errorTabs = tabsWithErrors(errors);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !skipGuard.current && currentLocation.pathname !== nextLocation.pathname,
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
        if (next === 'general') copy.delete('tab');
        else copy.set('tab', next);
        return copy;
      },
      { replace: true },
    );
  }

  function update(patch: Partial<FormState>) {
    setState((s) => ({ ...s, ...patch }));
    setErrors((current) => {
      const keys = Object.keys(patch).map((k) => (k === 'photo' ? 'photoId' : k));
      if (!keys.some((k) => current[k])) return current;
      const next = { ...current };
      for (const key of keys) delete next[key];
      return next;
    });
  }

  function reportErrors(found: FieldErrors) {
    setErrors(found);
    const first = Object.keys(found).find((key) => found[key]);
    if (first) setTab(tabOfField(first));
    toast({
      tone: 'error',
      title: 'تحقق من الحقول المطلوبة',
      description: 'بعض الحقول تحتاج إلى تصحيح قبل الحفظ.',
    });
  }

  async function save(event?: FormEvent) {
    event?.preventDefault();
    const { input, errors: found } = toInput(state);
    if (!input) return reportErrors(found);

    setSaving(true);
    setErrors({});
    try {
      if (!member) {
        const created = await teamApi.create(input);
        skipGuard.current = true;
        toast({ title: 'تمت إضافة العضو', description: created.nameAr });
        void navigate(`/team/${created.id}`, { replace: true });
        return;
      }
      const updated = await teamApi.update(member.id, input);
      const next = toState(updated);
      setMember(updated);
      setBaseline(next);
      setState(next);
      toast({ title: 'تم حفظ التغييرات' });
    } catch (err) {
      const fieldErrors = fieldErrorsOf(err);
      if (Object.keys(fieldErrors).length > 0) return reportErrors(fieldErrors);
      toast({
        tone: 'error',
        title: 'تعذّر حفظ العضو',
        description: err instanceof ApiError ? describeApiError(err) : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!member) return;
    setDeleting(true);
    try {
      await teamApi.remove(member.id);
      skipGuard.current = true;
      toast({ title: 'تم حذف العضو', description: member.nameAr });
      void navigate('/team', { replace: true });
    } catch (err) {
      setDeleting(false);
      toast({
        tone: 'error',
        title: 'تعذّر حذف العضو',
        description: err instanceof ApiError ? describeApiError(err) : undefined,
      });
    }
  }

  const title = state.nameAr.trim() || member?.nameAr || 'عضو جديد';
  const tabProps = { state, update, errors };
  const submitLabel = member ? 'حفظ التغييرات' : 'إضافة العضو';

  return (
    <form className="grid gap-6 pb-24" onSubmit={(e) => void save(e)} noValidate>
      <div className="grid gap-3">
        <Link
          to="/team"
          className="inline-flex items-center gap-1.5 justify-self-start text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="size-4 ltr:rotate-180" /> فريق القيادة
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {member ? (
                <>
                  <Badge tone={member.visible ? 'success' : 'neutral'}>
                    {member.visible ? 'ظاهر في الموقع' : 'مخفي'}
                  </Badge>
                  <span>آخر تحديث {formatDate(member.updatedAt)}</span>
                </>
              ) : (
                <span>أدخل بيانات العضو واختر صورته ثم احفظ.</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {member?.visible && (
              <Button asChild variant="outline">
                <a href={`${env.siteUrl}/ar/leadership`} target="_blank" rel="noreferrer">
                  <ExternalLink /> عرض في الموقع
                </a>
              </Button>
            )}
            {member && (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 /> حذف
              </Button>
            )}
            <Button type="submit" disabled={saving || (!!member && !dirty)}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>

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

        <TabsContent value="general">
          <GeneralTab {...tabProps} />
        </TabsContent>
        <TabsContent value="media">
          <MediaTab {...tabProps} />
        </TabsContent>
      </Tabs>

      {(dirty || !member) && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 shadow-[0_-4px_16px_rgb(0_0_0/0.06)] backdrop-blur md:start-64">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-3 lg:px-8">
            <p className="flex items-center gap-2 text-sm">
              <span className="size-2 rounded-full bg-warning" />
              {member ? 'لديك تغييرات غير محفوظة' : 'عضو جديد — لم يُحفظ بعد'}
            </p>
            <div className="flex gap-2">
              {member ? (
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
              ) : (
                <Button asChild variant="ghost">
                  <Link to="/team">إلغاء</Link>
                </Button>
              )}
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                {submitLabel}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => !open && blocker.reset?.()}
        title="مغادرة دون حفظ؟"
        description="لديك تغييرات غير محفوظة لهذا العضو وستفقدها إذا غادرت الصفحة."
        confirmLabel="مغادرة دون حفظ"
        onConfirm={() => blocker.proceed?.()}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        busy={deleting}
        title="حذف العضو؟"
        description={`سيُحذف «${member?.nameAr ?? ''}» ويختفي من قسم كلمة الإدارة في الموقع.`}
        onConfirm={() => void remove()}
      />
    </form>
  );
}
