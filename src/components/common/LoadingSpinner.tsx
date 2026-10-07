import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label = 'Loading data...',
  className,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 gap-3 text-muted-foreground', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {label && <p className="text-xs font-medium tracking-wide">{label}</p>}
    </div>
  );
};
