import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  count?: number | string;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  count,
  actions,
  className,
}) => {
  return (
    <div className={cn("flex items-center justify-between gap-3 py-1 select-none", className)}>
      <div className="flex items-center gap-2">
        <h2 className="text-section-title text-txt-primary">{title}</h2>
        {count !== undefined && (
          <span className="inline-flex items-center px-1.5 py-0.2 rounded-badge text-[11px] font-semibold bg-slate-100 text-txt-secondary border border-border tabular-nums">
            {count}
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-txt-muted hidden sm:inline">
            — {subtitle}
          </span>
        )}
      </div>
      {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
    </div>
  );
};
