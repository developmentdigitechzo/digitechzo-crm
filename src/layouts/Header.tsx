import React from 'react';
import { Menu, Bell, Search, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`
    : 'DZ';

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-white px-4 sm:px-6 select-none">
      {/* Left: Mobile Toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-txt-secondary h-8 w-8"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation drawer"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="relative w-full max-w-xs hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-txt-muted" />
          <Input
            placeholder="Search leads, tasks, deals..."
            className="pl-8 h-8 text-xs bg-slate-50 border-border focus-visible:bg-white"
          />
        </div>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-txt-secondary h-8 w-8 hover:bg-slate-100"
          aria-label="Notifications (1 unread)"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5 rounded-full bg-[#57B71B]" />
        </Button>

        <div className="h-4 w-px bg-border hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 cursor-pointer"
              aria-label="Open user profile menu"
            >
              <Avatar className="h-7 w-7 border border-border">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.firstName} />}
                <AvatarFallback className="bg-primary-soft text-primary text-[11px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-txt-primary leading-none">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-[10px] text-txt-muted mt-0.5 leading-none">
                  {user?.role}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-0.5">
                <p className="text-xs font-semibold text-txt-primary">{user?.firstName} {user?.lastName}</p>
                <p className="text-[11px] text-txt-muted truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-xs">
              <UserIcon className="mr-2 h-3.5 w-3.5 text-txt-muted" />
              <span>Role: {user?.role}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-xs text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
