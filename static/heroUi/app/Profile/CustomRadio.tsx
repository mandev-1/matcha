"use client";

import React from "react";
import { Radio } from "@heroui/react";
import clsx from "clsx";

interface CustomRadioProps {
  value: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

const CustomRadio = (props: CustomRadioProps) => {
  const { value, description, className, children } = props;
  const isPink = value === "female";

  return (
    <Radio
      value={value}
      className={clsx(
        "group inline-flex items-center hover:opacity-70 active:opacity-50 justify-between flex-row-reverse tap-highlight-transparent m-0",
        "cursor-pointer border-2 border-default rounded-lg gap-4 p-4",
        isPink
          ? "data-[selected=true]:border-pink-500"
          : "data-[selected=true]:border-primary",
        className
      )}
    >
      <Radio.Control
        className={clsx(
          isPink
            ? "[&>span[data-selected=true]]:!bg-pink-500 [&>span[data-selected=true]]:!border-pink-500"
            : ""
        )}
      >
        <Radio.Indicator
          className={clsx(
            isPink
              ? "data-[selected=true]:!bg-pink-500 data-[selected=true]:!border-pink-500"
              : ""
          )}
        />
      </Radio.Control>
      <Radio.Content>
        {children && <span>{children}</span>}
        {description && (
          <span className="text-small text-foreground opacity-70">{description}</span>
        )}
      </Radio.Content>
    </Radio>
  );
};

export default CustomRadio;
