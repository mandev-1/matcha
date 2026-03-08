"use client";

import React from "react";
import { Select, Label, ListBox } from "@heroui/react";

/**
 * HeroUI v3 compatibility: v2 Select used selectedKeys/onSelectionChange and SelectItem children.
 * This wrapper provides the v2 API.
 */
export interface SelectCompatProps {
  placeholder?: string;
  label?: string;
  selectedKeys?: Iterable<string> | "all";
  onSelectionChange?: (keys: Iterable<string> | "all") => void;
  children?: React.ReactNode;
  className?: string;
  description?: string;
  isRequired?: boolean;
  isInvalid?: boolean;
  disabledKeys?: Iterable<string>;
  fullWidth?: boolean;
}

export function SelectCompat({
  placeholder,
  label,
  selectedKeys,
  onSelectionChange,
  children,
  className,
  description,
  isRequired,
  isInvalid,
  disabledKeys,
  fullWidth,
}: SelectCompatProps) {
  const value = React.useMemo(() => {
    if (!selectedKeys || selectedKeys === "all") return null;
    const keys = Array.from(selectedKeys);
    return keys[0] ?? null;
  }, [selectedKeys]);

  const onChange = React.useCallback(
    (value: React.Key | null) => {
      if (!onSelectionChange) return;
      if (value === null) onSelectionChange([]);
      else onSelectionChange([String(value)]);
    },
    [onSelectionChange]
  );

  const items = React.useMemo(() => {
    const childArray = React.Children.toArray(children);
    return childArray
      .filter((c) => React.isValidElement(c) && (c as React.ReactElement).key != null)
      .map((c) => {
        const el = c as React.ReactElement<{ children?: React.ReactNode }>;
        const id = String((el as React.ReactElement & { key?: React.Key }).key);
        return {
          id,
          textValue: typeof el.props.children === "string" ? el.props.children : id,
          children: el.props.children,
        };
      });
  }, [children]);

  return (
    <Select
      className={className}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      isRequired={isRequired}
      isInvalid={isInvalid}
      disabledKeys={disabledKeys}
      fullWidth={fullWidth}
    >
      {label && <Label>{label}</Label>}
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      {description && <span className="text-sm text-default-500">{description}</span>}
      <Select.Popover>
        <ListBox>
          {items.map((item) => (
            <ListBox.Item key={item.id} id={item.id} textValue={item.textValue}>
              {item.children}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
