import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  CheckSquare,
  Activity,
  Calendar,
  FileText,
  Briefcase,
  BarChart3,
  Users2,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Leads', href: '/leads', icon: Users },
  { title: 'Pipeline', href: '/pipeline', icon: KanbanSquare },
  { title: 'Tasks', href: '/tasks', icon: CheckSquare },
  { title: 'Activities', href: '/activities', icon: Activity },
  { title: 'Meetings', href: '/meetings', icon: Calendar },
  { title: 'Proposals', href: '/proposals', icon: FileText },
  { title: 'Customers', href: '/customers', icon: Briefcase },
  { title: 'Reports', href: '/reports', icon: BarChart3 },
];

const secondaryNavItems: NavItem[] = [
  { title: 'Team', href: '/team', icon: Users2 },
  { title: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container: Locked to 100vh with no bottom white gaps */}
      <aside
        className={cn(
          'h-screen flex flex-col bg-[#16181B] text-slate-200 transition-all duration-300 ease-in-out border-r border-[#2D3238] select-none z-50 shrink-0 sticky top-0',
          isCollapsed ? 'w-16' : 'w-64',
          isOpen ? 'translate-x-0 fixed left-0' : '-translate-x-full lg:translate-x-0 fixed lg:sticky'
        )}
      >
        {/* Brand Header: Generous breathing room, unclipped logo, clear branding */}
        {isCollapsed ? (
          <div className="flex flex-col items-center justify-center h-24 py-2 gap-2 border-b border-[#2D3238] shrink-0">
            <div className="h-10 w-10 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-md">
              <img
                src="/assets/images/logo.png"
                alt="DigiTechzo CRM"
                className="h-full w-full object-contain"
              />
            </div>
            <button
              onClick={onToggleCollapse}
              className="h-6 w-6 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-[#202428] transition-colors cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex h-20 items-center justify-between px-4 border-b border-[#2D3238] shrink-0">
            <div className="flex items-center gap-3.5 overflow-hidden">
              <div className="h-11 w-11 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-md">
                <img
                  src="/assets/images/logo.png"
                  alt="DigiTechzo CRM"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-[15px] tracking-tight text-white block leading-tight">
                  DigiTechzo
                </span>
                <span className="text-[11px] font-bold text-[#57B71B] tracking-wider block uppercase mt-0.5">
                  CRM Platform
                </span>
              </div>
            </div>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#202428] transition-colors cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Main Navigation: Always renders smoothly in expanded and collapsed modes */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                title={isCollapsed ? item.title : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-lg font-medium transition-colors',
                    isCollapsed
                      ? 'justify-center h-10 w-10 mx-auto'
                      : 'justify-between px-3 py-2 text-sm',
                    isActive
                      ? 'bg-[#57B71B] text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-[#202428] hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <div className={cn('flex items-center gap-3 min-w-0', isCollapsed && 'justify-center')}>
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0',
                        isActive ? 'text-white' : 'text-slate-400'
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </div>
                )}
              </NavLink>
            );
          })}

          <div className="pt-2 pb-1 px-2">
            <div className="h-px bg-[#2D3238]" />
          </div>

          {secondaryNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                title={isCollapsed ? item.title : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-lg font-medium transition-colors',
                    isCollapsed
                      ? 'justify-center h-10 w-10 mx-auto'
                      : 'justify-between px-3 py-2 text-sm',
                    isActive
                      ? 'bg-[#57B71B] text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-[#202428] hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <div className={cn('flex items-center gap-3 min-w-0', isCollapsed && 'justify-center')}>
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0',
                        isActive ? 'text-white' : 'text-slate-400'
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Authenticated User Status Footer */}
        <div className="p-3 border-t border-[#2D3238] bg-[#121416] shrink-0">
          {isCollapsed ? (
            <div
              className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg bg-[#202428] text-white font-bold text-xs border border-[#2D3238] cursor-default"
              title={user ? `${user.firstName} ${user.lastName} (${user.role})` : 'User'}
            >
              {user?.firstName?.[0] || 'U'}
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#181B1F] border border-[#2D3238]/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-[#24292E] text-white font-bold text-xs flex items-center justify-center shrink-0 border border-[#2D3238]">
                  {user?.firstName?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-xs text-slate-200 block truncate leading-tight">
                    {user ? `${user.firstName} ${user.lastName}` : 'Administrator'}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                    {user?.role || 'ADMIN'} &bull; {user?.organization?.name || 'DigiTechzo'}
                  </span>
                </div>
              </div>
              <span className="h-2 w-2 rounded-full bg-[#57B71B] ml-2 shrink-0" title="Online" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
