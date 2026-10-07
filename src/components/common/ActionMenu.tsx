import React from 'react';
import { MoreHorizontal, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface ActionMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  separatorBefore?: boolean;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  triggerClassName?: string;
  align?: 'start' | 'end';
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  items,
  triggerClassName,
  align = 'end',
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn("h-7 w-7 text-txt-muted hover:text-txt-primary cursor-pointer", triggerClassName)}
          aria-label="Open action menu"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-40">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <React.Fragment key={idx}>
              {item.separatorBefore && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={item.onClick}
                disabled={item.disabled}
                className={cn(
                  "text-xs cursor-pointer",
                  item.variant === 'danger' ? "text-destructive focus:text-destructive" : ""
                )}
              >
                {Icon && <Icon className="mr-2 h-3.5 w-3.5" />}
                <span>{item.label}</span>
              </DropdownMenuItem>
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
