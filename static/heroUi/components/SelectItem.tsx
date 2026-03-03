"use client";

/**
 * HeroUI v3 compatibility: Used as child of SelectCompat. Renders nothing - data is extracted by SelectCompat.
 */
export interface SelectItemProps {
  key: string;
  children?: React.ReactNode;
}

export function SelectItem(_props: SelectItemProps) {
  return null;
}
