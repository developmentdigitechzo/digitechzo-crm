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
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  badge?: string;
  badgeVariant?: 'danger' | 'info' | 'neutral';
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Leads', href: '/leads', icon: Users, badge: '4', badgeVariant: 'info' },
  { title: 'Pipeline', href: '/pipeline', icon: KanbanSquare },
  { title: 'Tasks', href: '/tasks', icon: CheckSquare, badge: '1', badgeVariant: 'danger' },
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
  const { user, allMockUsers, switchUser } = useAuth();

  return (
    <TooltipProvider delayDuration={100}>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full flex-col bg-[#16181B] text-slate-200 transition-all duration-200 ease-in-out lg:static lg:translate-x-0 flex border-r border-[#2D3238] shadow-lg lg:shadow-none select-none',
          isCollapsed ? 'w-16' : 'w-56',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-3 border-b border-[#2D3238]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-btn bg-white p-0.5 flex items-center justify-center shrink-0 shadow-sm">
              <img
                src="/assets/images/digitechzo-favicon.png"
                alt="DigiTechzo"
                className="h-full w-full object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <span className="font-bold text-sm tracking-tight text-white block leading-none">
                  DigiTechzo
                </span>
                <span className="text-[10px] font-semibold text-[#57B71B] tracking-wider block uppercase mt-0.5">
                  CRM
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-white hover:bg-[#202428] transition-colors cursor-pointer"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const linkContent = (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-btn py-1.5 text-body-sm font-medium transition-colors',
                    isCollapsed ? 'justify-center px-0 h-9' : 'justify-between px-2.5',
                    isActive
                      ? 'bg-[#57B71B] text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-[#202428] hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isActive ? 'text-white' : 'text-slate-400'
                        )}
                      />
                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                    </div>
                    {!isCollapsed && item.badge && (
                      <span
                        className={cn(
                          'ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0',
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeVariant === 'danger'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    {item.title} {item.badge ? `(${item.badge})` : ''}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}

          <div className="pt-2 pb-1 px-2">
            <div className="h-px bg-[#2D3238]" />
          </div>

          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const linkContent = (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-btn py-1.5 text-body-sm font-medium transition-colors',
                    isCollapsed ? 'justify-center px-0 h-9' : 'justify-between px-2.5',
                    isActive
                      ? 'bg-[#57B71B] text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-[#202428] hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isActive ? 'text-white' : 'text-slate-400'
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </div>
                )}
              </NavLink>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </div>

        {/* User Role Switcher */}
        <div className="p-2 border-t border-[#2D3238] bg-[#121416]">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-1 mb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-[#57B71B]" /> User Role
              </span>
              <span className="text-[9px] text-slate-500">Mock</span>
            </div>
          )}

          <div className="space-y-0.5">
            {allMockUsers.map((u) => {
              const isCurrent = user?.id === u.id;
              const buttonContent = (
                <button
                  key={u.id}
                  onClick={() => switchUser(u.id)}
                  className={cn(
                    'w-full flex items-center rounded text-left text-[11px] transition-colors cursor-pointer',
                    isCollapsed ? 'justify-center p-1.5' : 'justify-between px-2 py-1',
                    isCurrent
                      ? 'bg-[#202428] text-white font-medium border border-[#2D3238]'
                      : 'text-slate-400 hover:bg-[#202428]/60 hover:text-slate-200'
                  )}
                  aria-label={`Switch to ${u.firstName} (${u.role})`}
                >
                  {isCollapsed ? (
                    <span className="text-[10px] font-bold text-white uppercase">{u.firstName[0]}</span>
                  ) : (
                    <>
                      <div className="truncate">
                        <span className="font-medium text-slate-200 block truncate leading-tight">
                          {u.firstName} {u.lastName}
                        </span>
                        <span className="text-[9px] text-slate-400">{u.role}</span>
                      </div>
                      {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-[#57B71B] ml-1 shrink-0" />}
                    </>
                  )}
                </button>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={u.id}>
                    <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={10}>
                      {u.firstName} ({u.role})
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return buttonContent;
            })}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};
