import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertBannerProps {
  variant?: 'danger' | 'warning' | 'info' | 'success';
  title?: string;
  message: React.ReactNode;
  action?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const variantStyles = {
  danger: {
    container: 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]',
    icon: AlertCircle,
    iconColor: 'text-[#DC2626]',
  },
  warning: {
    container: 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]',
    icon: AlertTriangle,
    iconColor: 'text-[#D97706]',
  },
  info: {
    container: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]',
    icon: Info,
    iconColor: 'text-[#2563EB]',
  },
  success: {
    container: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]',
    icon: CheckCircle2,
    iconColor: 'text-[#16A34A]',
  },
};

export const AlertBanner: React.FC<AlertBannerProps> = ({
  variant = 'warning',
  title,
  message,
  action,
  onClose,
  className,
}) => {
  const current = variantStyles[variant];
  const Icon = current.icon;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start sm:items-center justify-between gap-3 p-3 rounded-card border select-none transition-colors",
        current.container,
        className
      )}
    >
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        <Icon className={cn("h-4 w-4 shrink-0 mt-0.5 sm:mt-0", current.iconColor)} />
        <div className="text-xs leading-relaxed">
          {title && <span className="font-semibold mr-1.5">{title}</span>}
          <span>{message}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {action && <div>{action}</div>}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-current opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Dismiss alert"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
