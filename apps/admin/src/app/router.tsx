import { lazy, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';

import { AuthRoot } from '@/features/auth/auth-root';
import { RequireAuth } from '@/features/auth/require-auth';
import { RequirePermission } from '@/features/auth/require-permission';
import type { Resource } from '@/features/auth/types';
import { DashboardLayout } from '@/layouts/dashboard-layout';

const LoginPage = lazy(() => import('@/pages/login'));
const DashboardPage = lazy(() => import('@/pages/dashboard'));
const ProjectsPage = lazy(() => import('@/pages/projects'));
const ProjectEditPage = lazy(() => import('@/pages/projects/edit'));
const ServicesPage = lazy(() => import('@/pages/services'));
const ServiceEditPage = lazy(() => import('@/pages/services/edit'));
const MediaLibraryPage = lazy(() => import('@/pages/media'));
const LeadsPage = lazy(() => import('@/pages/leads'));
const PartnersPage = lazy(() => import('@/pages/partners'));
const PartnerEditPage = lazy(() => import('@/pages/partners/edit'));
const TeamPage = lazy(() => import('@/pages/team'));
const TeamMemberEditPage = lazy(() => import('@/pages/team/edit'));
const PagesPage = lazy(() => import('@/pages/pages'));
const PageEditPage = lazy(() => import('@/pages/pages/edit'));
const SettingsPage = lazy(() => import('@/pages/settings'));
const GlobalContentPage = lazy(() => import('@/pages/settings/content'));
const UsersPage = lazy(() => import('@/pages/users'));
const AuditLogsPage = lazy(() => import('@/pages/audit-logs'));
const NotFoundPage = lazy(() => import('@/pages/not-found'));

/** Route element visible only to roles that may read `resource` (the API enforces it too). */
const guarded = (resource: Resource, element: ReactNode) => (
  <RequirePermission resource={resource}>{element}</RequirePermission>
);

export const router = createBrowserRouter([
  {
    element: <AuthRoot />,
    children: [
      { path: 'login', element: <LoginPage /> },
      {
        // Everything below requires a signed-in user — add new CMS modules here.
        element: <RequireAuth />,
        children: [
          {
            path: '/',
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'projects', element: guarded('projects', <ProjectsPage />) },
              { path: 'projects/:id', element: guarded('projects', <ProjectEditPage />) },
              { path: 'services', element: guarded('services', <ServicesPage />) },
              { path: 'services/:id', element: guarded('services', <ServiceEditPage />) },
              { path: 'media', element: guarded('media', <MediaLibraryPage />) },
              { path: 'leads', element: guarded('leads', <LeadsPage />) },
              { path: 'partners', element: guarded('partners', <PartnersPage />) },
              { path: 'partners/:id', element: guarded('partners', <PartnerEditPage />) },
              { path: 'team', element: guarded('team', <TeamPage />) },
              { path: 'team/:id', element: guarded('team', <TeamMemberEditPage />) },
              { path: 'pages', element: guarded('pages', <PagesPage />) },
              { path: 'pages/:slug', element: guarded('pages', <PageEditPage />) },
              { path: 'content', element: <Navigate to="/pages" replace /> },
              { path: 'settings', element: guarded('settings', <SettingsPage />) },
              // Global Content is site copy: it follows the pages permission.
              { path: 'settings/content', element: guarded('pages', <GlobalContentPage />) },
              { path: 'users', element: guarded('users', <UsersPage />) },
              { path: 'audit-logs', element: guarded('auditLogs', <AuditLogsPage />) },
              // Unknown admin URLs: 404 inside the guarded layout (sidebar stays usable).
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
