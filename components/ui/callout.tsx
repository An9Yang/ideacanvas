"use client";

import * as React from "react";
import { cn } from "@/lib/utils/common";
import { cva, type VariantProps } from "class-variance-authority";

const calloutVariants = cva(
  "relative w-full rounded-lg border p-4 my-3",
  {
    variants: {
      variant: {
        default: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800",
        info: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800",
        warning: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
        success: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
        error: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CalloutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof calloutVariants> {
  title?: string;
}

const Callout = React.forwardRef<HTMLDivElement, CalloutProps>(
  ({ className, variant, title, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(calloutVariants({ variant }), className)}
        {...props}
      >
        {title && (
          <div className="mb-2 font-medium text-sm">
            {title}
          </div>
        )}
        <div className="text-sm">
          {children}
        </div>
      </div>
    );
  }
);

Callout.displayName = "Callout";

export { Callout, calloutVariants };
