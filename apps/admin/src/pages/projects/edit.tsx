import {
  ArrowRight,
  ExternalLink,
  FileText,
  Images,
  ListChecks,
  Loader2,
  MapPin,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router';

import { EmptyState, Skeleton } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast-context';
import { projectsApi } from '@/features/projects/api';
import {
  FeaturedBadge,
  ProjectStatusBadge,
  PublishBadge,
} from '@/features/projects/project-badges';
import {
  type EditorTab,
  fieldErrorsOf,
  type FieldErrors,
  type FormState,
  tabOfField,
  tabsWithErrors,
  toInput,
  toState,
} from '@/features/projects/project-form-state';
import { DetailsTab, GeneralTab, LocationTab, SeoTab } from '@/features/projects/project-form-tabs';
import { ProjectImages } from '@/features/projects/project-images';
import type { ProjectDetail, ProjectImage } from '@/features/projects/types';
import { ApiError } from '@/lib/api-client';
import { env } from '@/lib/env';
import { formatDate } from '@/lib/format';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';

const TABS: Array<{ value: EditorTab; label: string; icon: typeof FileText }> = [
  { value: 'general', label: 'المعلومات العامة', icon: FileText },
  { value: 'media', label: 'الوسائط', icon: Images },
  { value: 'details', label: 'التفاصيل', icon: ListChecks },
  { value: 'location', label: 'الموقع', icon: MapPin },
  { value: 'seo', label: 'تحسين محركات البحث', icon: Search },
];
const isTab = (value: string | null): value is EditorTab => TABS.some((t) => t.value === value);

const firstCoverId = (gallery: ProjectImage[]) =>
  gallery.filter((i) => i.category === 'COVER').sort((a, b) => a.order - b.order)[0]?.mediaId ??
  null;

export default function ProjectEditPage() {
  const { id = 'new' } = useParams();
  return id === 'new' ? <ProjectEditor key="new" initial={null} /> : <LoadedEditor id={id} />;
}

function LoadedEditor({ id }: { id: string }) {
  const { data, error, reload } = useApiQuery(`project|${id}`, () => projectsApi.get(id));

  if (error && !data) {
    return (
      <EmptyState
        icon={<FileText />}
        title="تعذّر تحميل المشروع"
        description={describeApiError(error)}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={reload}>
              إعادة المحاولة
            </Button>
            <Button asChild variant="ghost">
              <Link to="/projects">العودة للمشاريع</Link>
            </Button>
          </div>
        }
      />
    );
  }
  if (!data || data.id !== id) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  return <ProjectEditor key={data.id} initial={data} />;
}

function ProjectEditor({ initial }: { initial: ProjectDetail | null }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab: EditorTab = isTab(tabParam) ? tabParam : 'general';

  const [project, setProject] = useState(initial);
  const [baseline, setBaseline] = useState(() => toState(initial ?? undefined));
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
      const keys = Object.keys(patch);
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
      if (!project) {
        const created = await projectsApi.create(input);
        skipGuard.current = true;
        toast({ title: 'تم إنشاء المشروع', description: 'يمكنك الآن إضافة صورة الغلاف والمعرض.' });
        void navigate(`/projects/${created.id}?tab=media`, { replace: true });
        return;
      }
      const updated = await projectsApi.update(project.id, input);
      const next = toState(updated);
      setProject(updated);
      setBaseline(next);
      setState(next);
      toast({ title: 'تم حفظ التغييرات' });
    } catch (err) {
      const fieldErrors = fieldErrorsOf(err);
      if (Object.keys(fieldErrors).length > 0) return reportErrors(fieldErrors);
      toast({
        tone: 'error',
        title: 'تعذّر حفظ المشروع',
        description: err instanceof ApiError ? describeApiError(err) : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  function onImagesChange(gallery: ProjectImage[]) {
    if (!project) return;
    setProject({ ...project, gallery });
    const coverImageId = firstCoverId(gallery);
    if (coverImageId === project.coverImageId) return;
    // Keep `coverImageId` pointing at the first COVER image so cards and the page hero agree.
    projectsApi
      .update(project.id, { coverImageId })
      .then((updated) =>
        setProject((p) =>
          p
            ? {
                ...p,
                coverImageId: updated.coverImageId,
                coverImage: updated.coverImage,
                updatedAt: updated.updatedAt,
              }
            : p,
        ),
      )
      .catch(() => toast({ tone: 'error', title: 'تعذّر تحديث صورة الغلاف للمشروع' }));
  }

  async function remove() {
    if (!project) return;
    setDeleting(true);
    try {
      await projectsApi.remove(project.id);
      skipGuard.current = true;
      toast({ title: 'تم حذف المشروع', description: project.titleAr });
      void navigate('/projects', { replace: true });
    } catch (err) {
      setDeleting(false);
      toast({
        tone: 'error',
        title: 'تعذّر حذف المشروع',
        description: err instanceof ApiError ? describeApiError(err) : undefined,
      });
    }
  }

  const title = state.titleAr.trim() || project?.titleAr || 'مشروع جديد';
  const tabProps = { state, update, errors };

  return (
    <form className="grid gap-6 pb-24" onSubmit={(e) => void save(e)} noValidate>
      <div className="grid gap-3">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 justify-self-start text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="size-4 ltr:rotate-180" /> المشاريع
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {project ? (
                <>
                  <PublishBadge status={project.publishStatus} />
                  <ProjectStatusBadge status={project.status} />
                  {project.featured && <FeaturedBadge />}
                  <span>آخر تحديث {formatDate(project.updatedAt)}</span>
                </>
              ) : (
                <span>أدخل البيانات الأساسية ثم احفظ لإضافة الصور.</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {project?.publishStatus === 'PUBLISHED' && (
              <Button asChild variant="outline">
                <a
                  href={`${env.siteUrl}/ar/projects/${project.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink /> عرض في الموقع
                </a>
              </Button>
            )}
            {project && (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 /> حذف
              </Button>
            )}
            <Button type="submit" disabled={saving || (!!project && !dirty)}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {project ? 'حفظ التغييرات' : 'إنشاء المشروع'}
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
              {value === 'media' && project && (
                <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">
                  {project.gallery.length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general">
          <GeneralTab {...tabProps} />
        </TabsContent>
        <TabsContent value="media">
          {project ? (
            <ProjectImages
              projectId={project.id}
              images={project.gallery}
              onChange={onImagesChange}
            />
          ) : (
            <EmptyState
              icon={<Images />}
              title="احفظ المشروع أولًا لإضافة الصور"
              description="الصور ترتبط بالمشروع بعد إنشائه. أكمل «المعلومات العامة» ثم اضغط «إنشاء المشروع»."
            />
          )}
        </TabsContent>
        <TabsContent value="details">
          <DetailsTab {...tabProps} />
        </TabsContent>
        <TabsContent value="location">
          <LocationTab {...tabProps} />
        </TabsContent>
        <TabsContent value="seo">
          <SeoTab {...tabProps} />
        </TabsContent>
      </Tabs>

      {(dirty || !project) && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 shadow-[0_-4px_16px_rgb(0_0_0/0.06)] backdrop-blur md:start-64">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-3 lg:px-8">
            <p className="flex items-center gap-2 text-sm">
              <span className="size-2 rounded-full bg-warning" />
              {project ? 'لديك تغييرات غير محفوظة' : 'مشروع جديد — لم يُحفظ بعد'}
            </p>
            <div className="flex gap-2">
              {project ? (
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
                  <Link to="/projects">إلغاء</Link>
                </Button>
              )}
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                {project ? 'حفظ التغييرات' : 'إنشاء المشروع'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => !open && blocker.reset?.()}
        title="مغادرة دون حفظ؟"
        description="لديك تغييرات غير محفوظة في هذا المشروع وستفقدها إذا غادرت الصفحة."
        confirmLabel="مغادرة دون حفظ"
        onConfirm={() => blocker.proceed?.()}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        busy={deleting}
        title="حذف المشروع؟"
        description={`سيُحذف «${project?.titleAr ?? ''}» ويختفي من الموقع مع إزالة ارتباط صوره.`}
        onConfirm={() => void remove()}
      />
    </form>
  );
}
