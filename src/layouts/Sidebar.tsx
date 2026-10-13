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
  X,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useSidebarTheme, isColorDark } from '@/context/SidebarThemeContext';

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
  { title: 'In-Voice', href: '/invoices', icon: Receipt },
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
  const { appliedTheme, isAppliedBgDark } = useSidebarTheme();
  const isAccentDark = isColorDark(appliedTheme.accentColor);

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
        style={{
          backgroundColor: appliedTheme.bgColor,
          color: appliedTheme.textColor,
          borderColor: isAppliedBgDark ? '#2D3238' : 'rgba(0,0,0,0.12)',
        }}
        className={cn(
          'h-screen flex flex-col transition-all duration-300 ease-in-out border-r select-none z-50 shrink-0 sticky top-0',
          isCollapsed ? 'w-16' : 'w-64',
          isOpen ? 'translate-x-0 fixed left-0' : '-translate-x-full lg:translate-x-0 fixed lg:sticky'
        )}
      >
        {/* Brand Header: Generous breathing room, unclipped logo, clear branding */}
        {isCollapsed ? (
          <div
            style={{ borderColor: isAppliedBgDark ? '#2D3238' : 'rgba(0,0,0,0.12)' }}
            className="flex flex-col items-center justify-center h-24 py-2 gap-2 border-b shrink-0"
          >
            <div className="h-10 w-10 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-md">
              <img
                src="/assets/images/logo.png"
                alt="DigiTechzo CRM"
                className="h-full w-full object-contain"
              />
            </div>
            <button
              onClick={onToggleCollapse}
              style={{ color: appliedTheme.textColor }}
              className={cn(
                'h-6 w-6 flex items-center justify-center rounded-md transition-colors cursor-pointer',
                isAppliedBgDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
              )}
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            style={{ borderColor: isAppliedBgDark ? '#2D3238' : 'rgba(0,0,0,0.12)' }}
            className="flex h-20 items-center justify-between px-4 border-b shrink-0"
          >
            <div className="flex items-center gap-3.5 overflow-hidden">
              <div className="h-11 w-11 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-md">
                <img
                  src="/assets/images/logo.png"
                  alt="DigiTechzo CRM"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <span
                  style={{ color: appliedTheme.textColor }}
                  className="font-extrabold text-[15px] tracking-tight block leading-tight truncate"
                >
                  DigiTechzo
                </span>
                <span
                  style={{ color: appliedTheme.accentColor }}
                  className="text-[11px] font-bold tracking-wider block uppercase mt-0.5"
                >
                  CRM Platform
                </span>
              </div>
            </div>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={onToggleCollapse}
              style={{ color: appliedTheme.textColor }}
              className={cn(
                'hidden lg:flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer',
                isAppliedBgDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
              )}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              style={{ color: appliedTheme.textColor }}
              className={cn(
                'lg:hidden flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer',
                isAppliedBgDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
              )}
              title="Close sidebar"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
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
                style={({ isActive }) =>
                  isActive
                    ? {
                        backgroundColor: appliedTheme.accentColor,
                        color: isAccentDark ? '#FFFFFF' : '#1E242B',
                      }
                    : { color: appliedTheme.textColor }
                }
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-lg font-medium transition-colors',
                    isCollapsed
                      ? 'justify-center h-10 w-10 mx-auto'
                      : 'justify-between px-3 py-2 text-sm',
                    isActive
                      ? 'font-semibold shadow-sm'
                      : isAppliedBgDark
                        ? 'hover:bg-white/10'
                        : 'hover:bg-black/5'
                  )
                }
              >
                {({ isActive }) => (
                  <div className={cn('flex items-center gap-3 min-w-0', isCollapsed && 'justify-center')}>
                    <Icon
                      className="h-5 w-5 shrink-0"
                      style={{
                        color: isActive
                          ? isAccentDark
                            ? '#FFFFFF'
                            : '#1E242B'
                          : appliedTheme.textColor,
                      }}
                    />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </div>
                )}
              </NavLink>
            );
          })}

          <div className="pt-2 pb-1 px-2">
            <div
              className="h-px"
              style={{
                backgroundColor: isAppliedBgDark ? '#2D3238' : 'rgba(0,0,0,0.1)',
              }}
            />
          </div>

          {secondaryNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                title={isCollapsed ? item.title : undefined}
                style={({ isActive }) =>
                  isActive
                    ? {
                        backgroundColor: appliedTheme.accentColor,
                        color: isAccentDark ? '#FFFFFF' : '#1E242B',
                      }
                    : { color: appliedTheme.textColor }
                }
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-lg font-medium transition-colors',
                    isCollapsed
                      ? 'justify-center h-10 w-10 mx-auto'
                      : 'justify-between px-3 py-2 text-sm',
                    isActive
                      ? 'font-semibold shadow-sm'
                      : isAppliedBgDark
                        ? 'hover:bg-white/10'
                        : 'hover:bg-black/5'
                  )
                }
              >
                {({ isActive }) => (
                  <div className={cn('flex items-center gap-3 min-w-0', isCollapsed && 'justify-center')}>
                    <Icon
                      className="h-5 w-5 shrink-0"
                      style={{
                        color: isActive
                          ? isAccentDark
                            ? '#FFFFFF'
                            : '#1E242B'
                          : appliedTheme.textColor,
                      }}
                    />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Authenticated User Status Footer */}
        <div
          className="p-3 border-t shrink-0"
          style={{
            backgroundColor: isAppliedBgDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)',
            borderColor: isAppliedBgDark ? '#2D3238' : 'rgba(0,0,0,0.12)',
          }}
        >
          {isCollapsed ? (
            <div
              className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg font-bold text-xs border cursor-default"
              style={{
                backgroundColor: isAppliedBgDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                color: appliedTheme.textColor,
                borderColor: isAppliedBgDark ? '#2D3238' : 'rgba(0,0,0,0.1)',
              }}
              title={user ? `${user.firstName} ${user.lastName}` : 'User'}
            >
              {user?.firstName?.[0] || 'U'}
            </div>
          ) : (
            <div
              className="flex items-center justify-between px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: isAppliedBgDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                borderColor: isAppliedBgDark ? '#2D3238' : 'rgba(0,0,0,0.1)',
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="h-8 w-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: isAppliedBgDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    color: appliedTheme.textColor,
                    borderColor: isAppliedBgDark ? '#2D3238' : 'rgba(0,0,0,0.1)',
                  }}
                >
                  {user?.firstName?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <span
                    className="font-semibold text-xs block truncate leading-tight"
                    style={{ color: appliedTheme.textColor }}
                  >
                    {user ? `${user.firstName} ${user.lastName}` : 'Administrator'}
                  </span>
                  <span
                    className="text-[10px] block truncate mt-0.5 opacity-75"
                    style={{ color: appliedTheme.textColor }}
                  >
                    {user?.role || 'ADMIN'} &bull; {user?.organization?.name || 'DigiTechzo'}
                  </span>
                </div>
              </div>
              <span
                className="h-2 w-2 rounded-full ml-2 shrink-0"
                style={{ backgroundColor: appliedTheme.accentColor }}
                title="Online"
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
