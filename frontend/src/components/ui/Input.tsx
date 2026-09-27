import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, icon, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-white/70">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={clsx(
              "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-all focus:border-brand-400/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-brand-500/20",
              icon && "pl-10",
              error && "border-red-400/50 focus:border-red-400/60 focus:ring-red-500/20",
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-red-300">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

export default Input;
