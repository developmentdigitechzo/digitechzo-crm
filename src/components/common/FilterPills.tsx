import React from 'react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  id: string;
  label: string;
  count?: number | string;
  countVariant?: 'danger' | 'warning' | 'info' | 'neutral';
}

export interface FilterPillsProps {
  options: FilterOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

const countVariantClasses: Record<NonNullable<FilterOption['countVariant']>, string> = {
  danger: 'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-slate-200 text-slate-700',
};

export const FilterPills: React.FC<FilterPillsProps> = ({
  options,
  activeId,
  onChange,
  className,
}) => {
  return (
    <div className={cn("flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden", className)}>
      {options.map((opt) => {
        const isActive = opt.id === activeId;
        const countColor = opt.countVariant ? countVariantClasses[opt.countVariant] : 'bg-slate-100 text-txt-secondary';

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-btn text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer",
              isActive
                ? "bg-[#16181B] text-white shadow-subtle"
                : "bg-white text-txt-secondary hover:bg-slate-50 hover:text-txt-primary border border-border"
            )}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums",
                  isActive ? "bg-white/20 text-white" : countColor
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
