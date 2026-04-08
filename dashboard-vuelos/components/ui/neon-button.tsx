import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  neon?: boolean;
  variant?: 'solid' | 'outline' | 'ghost';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, neon = true, variant = 'outline', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center rounded-full px-8 py-3 font-semibold transition-all duration-300 gap-2",
          neon && "shadow-[0_0_15px_rgba(56,189,248,0.5)] border border-sky-400 text-sky-400 hover:shadow-[0_0_25px_rgba(56,189,248,0.8)] hover:bg-sky-400/10",
          !neon && variant === 'outline' && "border border-white/20 bg-white/10 text-white hover:bg-white/20",
          !neon && variant === 'solid' && "bg-sky-500 text-black hover:bg-sky-400",
          !neon && variant === 'ghost' && "hover:bg-white/10 text-white",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
