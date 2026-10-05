import {
  BriefcaseBusiness,
  Building2,
  FileText,
  Handshake,
  History,
  Images,
  Inbox,
  Languages,
  LayoutDashboard,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';

import type { Resource } from '@/features/auth/types';

export type NavItem = {
  title: string;
  to: string;
  icon: LucideIcon;
  /** Shown only to roles that may read this resource. */
  resource?: Resource;
};

export type NavGroup = { title: string; items: NavItem[] };

/* Mirrors the content domains of the public site; new CMS modules get an entry here. */
export const navigationGroups: NavGroup[] = [
  {
    title: 'عام',
    items: [{ title: 'لوحة المعلومات', to: '/', icon: LayoutDashboard }],
  },
  {
    title: 'إدارة المحتوى',
    items: [
      { title: 'المشاريع', to: '/projects', icon: Building2, resource: 'projects' },
      { title: 'الخدمات', to: '/services', icon: BriefcaseBusiness, resource: 'services' },
      { title: 'مكتبة الوسائط', to: '/media', icon: Images, resource: 'media' },
      { title: 'صفحات الموقع', to: '/pages', icon: FileText, resource: 'pages' },
      // Global Content is site copy: it follows the pages permission.
      { title: 'المحتوى العام', to: '/settings/content', icon: Languages, resource: 'pages' },
      { title: 'فريق القيادة', to: '/team', icon: Users, resource: 'team' },
      { title: 'الشركاء', to: '/partners', icon: Handshake, resource: 'partners' },
    ],
  },
  {
    title: 'العملاء',
    items: [{ title: 'طلبات الاهتمام', to: '/leads', icon: Inbox, resource: 'leads' }],
  },
  {
    title: 'النظام',
    items: [
      { title: 'المستخدمون', to: '/users', icon: UserCog, resource: 'users' },
      { title: 'سجل التغييرات', to: '/audit-logs', icon: History, resource: 'auditLogs' },
      { title: 'الإعدادات', to: '/settings', icon: Settings, resource: 'settings' },
    ],
  },
];

export const navigation: NavItem[] = navigationGroups.flatMap((group) => group.items);

/** The item a path belongs to: the longest match, so `/settings/content` is not `/settings`. */
export function navItemOf(pathname: string): NavItem | undefined {
  return navigation
    .filter(({ to }) =>
      to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`),
    )
    .sort((a, b) => b.to.length - a.to.length)[0];
}
