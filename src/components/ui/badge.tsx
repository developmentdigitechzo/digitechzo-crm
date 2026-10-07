import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-badge border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring select-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-white",
        secondary: "border-border bg-slate-100 text-txt-secondary",
        outline: "border-border bg-white text-txt-primary",
        success: "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]",
        warning: "border-[#FDE68A] bg-[#FFFBEB] text-[#D97706]",
        danger: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
        info: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
        tech: "border-[#DDD6FE] bg-[#F5F3FF] text-[#7C3AED]",
        brand: "border-[#BBF7D0] bg-[#F0FDF4] text-[#57B71B]",
        neutral: "border-[#E2E8F0] bg-[#F1F5F9] text-[#556070]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
