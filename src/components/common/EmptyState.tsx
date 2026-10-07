import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 sm:p-8 text-center rounded-card border border-dashed border-border bg-slate-50/50 select-none',
        className
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-btn bg-white border border-border mb-3 text-txt-muted shadow-subtle">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-semibold text-txt-primary">{title}</h3>
      <p className="text-xs text-txt-muted max-w-xs mt-1 mb-3.5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
