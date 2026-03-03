"use client";

import React from "react";
import { Separator } from "@heroui/react";

/** v3 compatibility: Divider -> Separator */
export function Divider(props: React.ComponentProps<typeof Separator>) {
  return <Separator {...props} />;
}
