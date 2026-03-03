"use client";

import React from "react";
import { Button } from "@heroui/react";

/**
 * Simple pagination - v3 Pagination uses composition API. This provides page/total/onChange.
 */
export interface PaginationCompatProps {
  page: number;
  total: number;
  onChange: (page: number) => void;
}

export function PaginationCompat({ page, total, onChange }: PaginationCompatProps) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        size="sm"
        variant="secondary"
        isDisabled={page <= 1}
        onPress={() => onChange(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-default-600">
        Page {page} of {total}
      </span>
      <Button
        size="sm"
        variant="secondary"
        isDisabled={page >= total}
        onPress={() => onChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
