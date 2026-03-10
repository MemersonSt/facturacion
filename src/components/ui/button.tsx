import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-purple-500 border-0",
        secondary: "bg-white/80 border border-slate-200/60 text-indigo-900 shadow-sm hover:bg-white backdrop-blur-sm",
        outline: "border border-slate-200 bg-white/50 text-slate-700 shadow-sm hover:bg-white hover:border-indigo-200 hover:text-indigo-900",
        destructive: "bg-red-500 text-white shadow-sm hover:bg-red-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
