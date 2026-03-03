"use client";

import React from "react";

/** Simple spacer - v3 has no Spacer, use div with flex-grow or margin */
export function Spacer({ x = 0, y = 0 }: { x?: number; y?: number }) {
  return <div style={{ width: x, height: y, flex: "1 1 auto" }} />;
}
