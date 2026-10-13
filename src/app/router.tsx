import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

// Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { LeadsPage } from '@/pages/leads/LeadsPage';
import { LeadDetailPage } from '@/pages/leads/LeadDetailPage';
import { PipelinePage } from '@/pages/pipeline/PipelinePage';
import { TasksPage } from '@/pages/tasks/TasksPage';
import { ActivitiesPage } from '@/pages/activities/ActivitiesPage';
import { MeetingsPage } from '@/pages/meetings/MeetingsPage';
import { ProposalsPage } from '@/pages/proposals/ProposalsPage';
import { InvoicesPage } from '@/pages/invoices/InvoicesPage';
import { CustomersPage } from '@/pages/customers/CustomersPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { TeamPage } from '@/pages/team/TeamPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
    ],
  },
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'leads',
        element: <LeadsPage />,
      },
      {
        path: 'leads/:id',
        element: <LeadDetailPage />,
      },
      {
        path: 'pipeline',
        element: <PipelinePage />,
      },
      {
        path: 'tasks',
        element: <TasksPage />,
      },
      {
        path: 'activities',
        element: <ActivitiesPage />,
      },
      {
        path: 'meetings',
        element: <MeetingsPage />,
      },
      {
        path: 'proposals',
        element: <ProposalsPage />,
      },
      {
        path: 'invoices',
        element: <InvoicesPage />,
      },
      {
        path: 'customers',
        element: <CustomersPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'team',
        element: <TeamPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
