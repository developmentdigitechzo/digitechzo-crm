import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  TrendingUp,
  CheckSquare,
  MoreHorizontal,
  Activity,
  Calendar,
  FileText,
  Receipt,
  Briefcase,
  BarChart3,
  Users2,
  Settings,
  X,
  LogOut,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export interface NavModuleItem {
  id: string;
  title: string;
  href: string;
  icon: React.ElementType;
}

// All 12 CRM Platform Modules in official system order
export const ALL_CRM_MODULES: NavModuleItem[] = [
  { id: 'dashboard', title: 'Home', href: '/dashboard', icon: Home },
  { id: 'leads', title: 'Leads', href: '/leads', icon: Users },
  { id: 'pipeline', title: 'Pipeline', href: '/pipeline', icon: TrendingUp },
  { id: 'tasks', title: 'Tasks', href: '/tasks', icon: CheckSquare },
  { id: 'activities', title: 'Activities', href: '/activities', icon: Activity },
  { id: 'meetings', title: 'Meetings', href: '/meetings', icon: Calendar },
  { id: 'proposals', title: 'Proposals', href: '/proposals', icon: FileText },
  { id: 'invoices', title: 'In-Voice', href: '/invoices', icon: Receipt },
  { id: 'customers', title: 'Customers', href: '/customers', icon: Briefcase },
  { id: 'reports', title: 'Reports', href: '/reports', icon: BarChart3 },
  { id: 'team', title: 'Team', href: '/team', icon: Users2 },
  { id: 'settings', title: 'Settings', href: '/settings', icon: Settings },
];

// The 4 primary quick tabs on the bottom bar
const primaryBottomItems: NavModuleItem[] = [
  { id: 'dashboard', title: 'Home', href: '/dashboard', icon: Home },
  { id: 'leads', title: 'Leads', href: '/leads', icon: Users },
  { id: 'pipeline', title: 'Pipeline', href: '/pipeline', icon: TrendingUp },
  { id: 'tasks', title: 'Tasks', href: '/tasks', icon: CheckSquare },
];

export const MobileBottomNav: React.FC = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Close more menu when route changes
  React.useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  // Check if current page is one of the secondary 8 modules
  const currentSecondaryModule = ALL_CRM_MODULES.slice(4).find((m) =>
    location.pathname.startsWith(m.href)
  );
  const isMoreActive = !!currentSecondaryModule;

  return (
    <>
      {/* 1. Mobile Bottom Bar (< lg) Pinned at down side matching image 1 and 3 */}
      <nav
        aria-label="Mobile navigation"
        className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1 select-none"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {primaryBottomItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? location.pathname === '/dashboard' || location.pathname === '/'
                : location.pathname.startsWith(item.href);

            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150',
                  isActive
                    ? 'text-[#57B71B]'
                    : 'text-slate-500 hover:text-slate-800 active:scale-95'
                )}
              >
                <Icon
                  className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    'text-[10px] tracking-tight mt-0.5 leading-none',
                    isActive ? 'font-extrabold text-[#57B71B]' : 'font-medium'
                  )}
                >
                  {item.title}
                </span>
              </NavLink>
            );
          })}

          {/* More Button: Opens the 12-module Grid */}
          <button
            type="button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            aria-expanded={isMoreOpen}
            aria-label="Open all modules menu"
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 cursor-pointer',
              isMoreActive || isMoreOpen
                ? 'text-[#57B71B]'
                : 'text-slate-500 hover:text-slate-800 active:scale-95'
            )}
          >
            <MoreHorizontal
              className={cn('h-5 w-5 transition-transform', (isMoreActive || isMoreOpen) && 'scale-110')}
              strokeWidth={isMoreActive || isMoreOpen ? 2.5 : 2}
            />
            <span
              className={cn(
                'text-[10px] tracking-tight mt-0.5 leading-none',
                isMoreActive || isMoreOpen ? 'font-extrabold text-[#57B71B]' : 'font-medium'
              )}
            >
              {currentSecondaryModule ? currentSecondaryModule.title : 'More'}
            </span>
          </button>
        </div>
      </nav>

      {/* 2. All Modules Drawer: Anchored right above the bottom bar */}
      {isMoreOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Drawer anchored at the down side right above the bottom navigation bar */}
          <div
            className="fixed inset-x-0 bottom-14 z-40 max-h-[calc(100vh-4rem)] bg-white rounded-t-3xl border-t border-slate-200/90 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 lg:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Drag Pill & Header */}
            <div className="pt-3 pb-2.5 px-4 flex flex-col border-b border-slate-100 shrink-0 bg-slate-50/70">
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-2" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                    DigiTechzo CRM
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#16A34A] border border-emerald-200">
                    All 12 Modules
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMoreOpen(false)}
                  className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 3x4 All Modules Grid (Clean Icon + Label, matching image 1 & 3 style) */}
            <div className="p-3 sm:p-4 overflow-y-auto">
              <div className="grid grid-cols-4 gap-y-3.5 gap-x-2">
                {ALL_CRM_MODULES.map((module) => {
                  const Icon = module.icon;
                  const isActive =
                    module.href === '/dashboard'
                      ? location.pathname === '/dashboard' || location.pathname === '/'
                      : location.pathname.startsWith(module.href);

                  return (
                    <button
                      key={module.href}
                      type="button"
                      onClick={() => {
                        navigate(module.href);
                        setIsMoreOpen(false);
                      }}
                      className={cn(
                        'flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all active:scale-95 cursor-pointer text-center group',
                        isActive
                          ? 'text-[#57B71B]'
                          : 'text-slate-600 hover:text-slate-900'
                      )}
                    >
                      <div
                        className={cn(
                          'h-12 w-12 rounded-2xl flex items-center justify-center transition-all mb-1 shrink-0',
                          isActive
                            ? 'bg-[#EAF7E3] text-[#57B71B] border-2 border-[#57B71B] shadow-xs scale-105'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-800'
                        )}
                      >
                        <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      <span
                        className={cn(
                          'text-[11px] leading-tight text-center tracking-tight truncate w-full',
                          isActive ? 'font-extrabold text-[#57B71B]' : 'font-medium text-slate-700'
                        )}
                      >
                        {module.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compact Account Bar & Sign Out */}
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/80 shrink-0 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 rounded-full bg-[#EAF7E3] text-[#57B71B] font-extrabold text-[11px] flex items-center justify-center border border-[#d6f0cb] shrink-0">
                  {user?.firstName?.[0] || 'D'}
                  {user?.lastName?.[0] || 'A'}
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block truncate leading-none">
                    {user ? `${user.firstName} ${user.lastName}` : 'DigiTechzo Admin'}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate leading-none mt-0.5">
                    {user?.email || 'admin@digitechzo.com'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden xs:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px] font-bold">
                  <Shield className="h-2.5 w-2.5" />
                  {user?.role || 'ADMIN'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsMoreOpen(false);
                  }}
                  className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold transition-colors cursor-pointer shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
