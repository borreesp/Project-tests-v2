import * as React from "react";

import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

function Progress({ className, value = 0, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-secondary", className)} {...props}>
      <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300" style={{ width: `${clamped}%` }} />
    </div>
  );
}

export { Progress };
