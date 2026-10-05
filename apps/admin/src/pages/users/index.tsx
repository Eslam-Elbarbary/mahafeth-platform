import {
  FilterX,
  KeyRound,
  Pencil,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';

import { EmptyState, PageHeader, Skeleton } from '@/components/layout/page-header';
import { StatCard } from '@/components/layout/stat-card';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Select } from '@/components/ui/form-controls';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast-context';
import { useAuth } from '@/features/auth/auth-context';
import type { Role } from '@/features/auth/types';
import { describeUserError, type UserListQuery, usersApi } from '@/features/users/api';
import { ResetPasswordDialog } from '@/features/users/reset-password-dialog';
import {
  ROLES,
  roleMeta,
  type User,
  USER_STATUSES,
  userStatusLabels,
  type UserStatus,
} from '@/features/users/types';
import { RoleBadge, UserAvatar } from '@/features/users/user-badges';
import { UserDrawer } from '@/features/users/user-drawer';
import { formatDate, formatNumber, formatRelative } from '@/lib/format';
import { useDebouncedValue } from '@/lib/hooks';
import { describeApiError, useApiQuery } from '@/lib/use-api-query';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;
const FILTER_KEYS = ['q', 'role', 'status'] as const;

function readFilters(params: URLSearchParams): UserListQuery {
  const role = params.get('role');
  const status = params.get('status');
  return {
    role: ROLES.includes(role as Role) ? (role as Role) : undefined,
    status: USER_STATUSES.includes(status as UserStatus) ? (status as UserStatus) : undefined,
  };
}

export default function UsersPage() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const filters = readFilters(params);
  const openId = params.get('user');
  const [search, setSearch] = useState(params.get('q') ?? '');
  const q = useDebouncedValue(search.trim());
  const [resetFor, setResetFor] = useState<User | null>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const query: UserListQuery = { ...filters, q: q || undefined, page, pageSize: PAGE_SIZE };
  const { data, error, loading, reload, mutate } = useApiQuery(
    `users|${JSON.stringify(query)}`,
    () => usersApi.list(query),
  );
  const stats = useApiQuery('user-stats', () => usersApi.stats());
  const opened = useApiQuery(`user|${openId}`, () =>
    openId && openId !== 'new' ? usersApi.get(openId) : Promise.resolve(null),
  );
  const drawerTarget =
    openId === 'new' ? 'new' : opened.data && opened.data.id === openId ? opened.data : null;

  const hasFilters = FILTER_KEYS.some((key) => params.has(key)) || search !== '';

  function setParam(key: string, value: string | undefined) {
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        if (key !== 'page' && key !== 'user') copy.delete('page');
        if (value) copy.set(key, value);
        else copy.delete(key);
        return copy;
      },
      { replace: true },
    );
  }

  function refresh() {
    reload();
    stats.reload();
  }

  function replaceInList(updated: User) {
    mutate((current) => ({
      ...current,
      data: current.data.map((user) => (user.id === updated.id ? updated : user)),
    }));
  }

  async function toggleStatus(user: User, isActive: boolean) {
    setToggling(user.id);
    replaceInList({ ...user, isActive });
    try {
      const updated = await usersApi.update(user.id, { isActive });
      replaceInList(updated);
      stats.reload();
      toast({
        title: isActive ? 'تم تفعيل الحساب' : 'تم تعطيل الحساب',
        description: updated.name,
      });
    } catch (err) {
      replaceInList(user);
      toast({ tone: 'error', title: 'تعذّر تغيير الحالة', description: describeUserError(err) });
    } finally {
      setToggling(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await usersApi.remove(toDelete.id);
      toast({ title: 'تم حذف المستخدم', description: toDelete.name });
      if (openId === toDelete.id) setParam('user', undefined);
      setToDelete(null);
      refresh();
    } catch (err) {
      toast({ tone: 'error', title: 'تعذّر حذف المستخدم', description: describeUserError(err) });
    } finally {
      setDeleting(false);
    }
  }

  const items = data?.data ?? [];
  const byRole = stats.data?.byRole;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="المستخدمون"
        description="حسابات الدخول إلى لوحة التحكم وأدوارها وصلاحياتها."
        actions={
          <Button onClick={() => setParam('user', 'new')}>
            <UserPlus /> مستخدم جديد
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Users />} label="إجمالي المستخدمين" value={stats.data?.total} />
        <StatCard icon={<UserCheck />} label="حسابات نشطة" value={stats.data?.active} />
        <StatCard icon={<UserX />} label="حسابات معطّلة" value={stats.data?.inactive} />
        <StatCard
          icon={<ShieldCheck />}
          label="المدراء العامون"
          value={byRole?.SUPER_ADMIN}
          hint={
            byRole &&
            `${formatNumber(byRole.ADMIN)} ${roleMeta.ADMIN.label} · ${formatNumber(byRole.EDITOR)} ${roleMeta.EDITOR.label}`
          }
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
        <div className="flex flex-wrap items-center gap-3 border-b p-3">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setParam('q', value.trim() || undefined);
            }}
            placeholder="ابحث بالاسم أو البريد…"
            className="min-w-56 flex-1"
          />
          <Select
            aria-label="الدور"
            className="w-auto min-w-36"
            value={filters.role ?? ''}
            onChange={(e) => setParam('role', e.target.value || undefined)}
          >
            <option value="">كل الأدوار</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {roleMeta[role].label}
              </option>
            ))}
          </Select>
          <Select
            aria-label="الحالة"
            className="w-auto min-w-32"
            value={filters.status ?? ''}
            onChange={(e) => setParam('status', e.target.value || undefined)}
          >
            <option value="">كل الحالات</option>
            {USER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {userStatusLabels[status]}
              </option>
            ))}
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setParams({}, { replace: true });
              }}
            >
              <FilterX /> مسح الفلاتر
            </Button>
          )}
        </div>

        {error && (
          <p className="border-b bg-destructive/5 p-3 text-sm text-destructive">
            {describeApiError(error)}
          </p>
        )}

        {!loading && items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Users />}
              title={hasFilters ? 'لا يوجد مستخدمون مطابقون' : 'لا يوجد مستخدمون بعد'}
              description={hasFilters ? 'غيّر الفلاتر أو كلمة البحث.' : undefined}
            />
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">المستخدم</th>
                  <th className="px-4 py-3 text-start font-medium">الدور</th>
                  <th className="px-4 py-3 text-start font-medium">الحالة</th>
                  <th className="px-4 py-3 text-start font-medium">آخر دخول</th>
                  <th className="px-4 py-3 text-start font-medium">طلبات مسندة</th>
                  <th className="px-4 py-3 text-start font-medium">تاريخ الإنشاء</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">إجراءات</span>
                  </th>
                </tr>
              </thead>
              <tbody className={loading ? 'opacity-60 transition-opacity' : undefined}>
                {loading && items.length === 0
                  ? Array.from({ length: 4 }, (_, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-3" colSpan={7}>
                          <Skeleton className="h-10 w-full" />
                        </td>
                      </tr>
                    ))
                  : items.map((user) => {
                      const isSelf = user.id === me?.id;
                      return (
                        <tr
                          key={user.id}
                          data-user-id={user.id}
                          className={cn(
                            'border-t transition-colors hover:bg-muted/30',
                            !user.isActive && 'text-muted-foreground',
                            openId === user.id && 'bg-muted/40',
                          )}
                        >
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className="flex items-center gap-3 text-start"
                              onClick={() => setParam('user', user.id)}
                            >
                              <UserAvatar
                                name={user.name}
                                className={cn(!user.isActive && 'opacity-50')}
                              />
                              <span className="grid gap-0.5">
                                <span className="font-semibold text-foreground">
                                  {user.name}
                                  {isSelf && (
                                    <span className="ms-1.5 text-xs font-normal text-muted-foreground">
                                      (أنت)
                                    </span>
                                  )}
                                </span>
                                <span className="text-xs text-muted-foreground" dir="ltr">
                                  {user.email}
                                </span>
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <RoleBadge role={user.role} />
                          </td>
                          <td className="px-4 py-3">
                            <label className="inline-flex items-center gap-2">
                              <Switch
                                checked={user.isActive}
                                disabled={isSelf || toggling === user.id}
                                aria-label={`حساب ${user.name} نشط`}
                                data-status-toggle={user.id}
                                onCheckedChange={(checked) => void toggleStatus(user, checked)}
                              />
                              <span className="text-xs">
                                {userStatusLabels[user.isActive ? 'ACTIVE' : 'INACTIVE']}
                              </span>
                            </label>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                            {user.lastLoginAt ? (
                              <time dateTime={user.lastLoginAt}>
                                {formatRelative(user.lastLoginAt)}
                              </time>
                            ) : (
                              'لم يسجّل الدخول'
                            )}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {formatNumber(user._count.assignedLeads)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label="تعديل"
                                title="تعديل"
                                onClick={() => setParam('user', user.id)}
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label="إعادة تعيين كلمة المرور"
                                title="إعادة تعيين كلمة المرور"
                                onClick={() => setResetFor(user)}
                              >
                                <KeyRound />
                              </Button>
                              {!isSelf && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  aria-label="حذف"
                                  title="حذف"
                                  onClick={() => setToDelete(user)}
                                >
                                  <Trash2 />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        )}

        {data && data.meta.total > 0 && (
          <div className="border-t p-3">
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={data.meta.total}
              onPageChange={(next) => setParam('page', next > 1 ? String(next) : undefined)}
            />
          </div>
        )}
      </div>

      <UserDrawer
        target={drawerTarget}
        currentUserId={me?.id}
        onClose={() => setParam('user', undefined)}
        onSaved={(saved, created) => {
          if (created) {
            setParam('user', undefined);
            refresh();
          } else {
            opened.mutate(() => saved);
            replaceInList(saved);
            stats.reload();
          }
        }}
        onResetPassword={setResetFor}
        onDelete={setToDelete}
      />

      <ResetPasswordDialog user={resetFor} onOpenChange={(open) => !open && setResetFor(null)} />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        busy={deleting}
        title="حذف المستخدم؟"
        description={`لن يتمكن «${toDelete?.name ?? ''}» من تسجيل الدخول بعد الآن. تبقى تغييراته محفوظة في سجل التغييرات.`}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
