import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, placeholder = 'Search...', ...props }, ref) => {
    return (
      <div className={cn("relative w-full sm:w-64 select-none", className)}>
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-txt-muted pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex h-8 w-full rounded-input border border-border bg-white pl-8 pr-8 text-xs text-txt-primary shadow-subtle placeholder:text-txt-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:bg-slate-50 transition-colors"
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              onClear?.();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-primary p-0.5 rounded transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
