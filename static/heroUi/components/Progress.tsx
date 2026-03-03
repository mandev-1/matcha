"use client";

import React from "react";

/** v3 compatibility: Progress bar - v3 may not have Progress, use simple div-based progress */
export interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
  color?: string;
}

export function Progress({ value = 0, max = 100, className, color = "primary" }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={className}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-default-200">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
