import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-btn text-xs font-semibold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer shadow-subtle active:scale-[0.99]",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-brand-green-hover shadow-sm",
        secondary: "bg-white text-txt-primary border border-border hover:bg-slate-50 hover:text-foreground hover:border-slate-300",
        outline: "border border-border bg-transparent text-txt-primary hover:bg-slate-50 hover:border-slate-300",
        ghost: "shadow-none text-txt-secondary hover:bg-slate-100 hover:text-txt-primary",
        destructive: "bg-destructive text-white hover:bg-red-700 shadow-sm",
        danger: "bg-destructive text-white hover:bg-red-700 shadow-sm",
        tech: "bg-brand-purple text-white hover:bg-purple-700 shadow-sm",
        link: "text-primary underline-offset-4 hover:underline shadow-none p-0 h-auto",
      },
      size: {
        default: "h-8 px-3.5 py-1.5",
        sm: "h-7 rounded-btn px-2.5 text-[11px]",
        lg: "h-9 rounded-btn px-4 text-xs font-semibold",
        icon: "h-8 w-8 p-0",
        "icon-sm": "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
