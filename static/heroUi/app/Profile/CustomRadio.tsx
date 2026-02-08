"use client";

import React from "react";
import { useRadio } from "@heroui/radio";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import clsx from "clsx";

interface CustomRadioProps {
  value: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

const CustomRadio = (props: CustomRadioProps) => {
  const {
    Component,
    children,
    description,
    getBaseProps,
    getWrapperProps,
    getInputProps,
    getLabelProps,
    getLabelWrapperProps,
    getControlProps,
  } = useRadio(props);

  const isPink = props.value === "female";

  return (
    <Component
      {...getBaseProps({
        className: clsx(
          "group inline-flex items-center hover:opacity-70 active:opacity-50 justify-between flex-row-reverse tap-highlight-transparent m-0",
          "cursor-pointer border-2 border-default rounded-lg gap-4 p-4",
          isPink 
            ? "data-[selected=true]:border-pink-500" 
            : "data-[selected=true]:border-primary",
          props.className,
        ),
        "data-value": props.value,
      })}
    >
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <span {...getWrapperProps({
        className: clsx(
          isPink 
            ? "[&>span[data-selected=true]]:!bg-pink-500 [&>span[data-selected=true]]:!border-pink-500 [&>span[data-selected=true]>span]:!bg-pink-500" 
            : "",
        ),
        style: isPink ? {
          "--heroui-primary": "#ec4899",
          "--heroui-primary-foreground": "#ffffff",
        } as React.CSSProperties : undefined,
      })}>
        <span 
          {...getControlProps({
            className: clsx(
              isPink 
                ? "data-[selected=true]:!bg-pink-500 data-[selected=true]:!border-pink-500 [&>span]:!bg-pink-500" 
                : "",
            ),
            style: isPink ? {
              "--heroui-primary": "#ec4899",
              "--heroui-primary-foreground": "#ffffff",
            } as React.CSSProperties : undefined,
          })} 
        />
      </span>
      <div {...getLabelWrapperProps()}>
        {children && <span {...getLabelProps()}>{children}</span>}
        {description && (
          <span className="text-small text-foreground opacity-70">{description}</span>
        )}
      </div>
    </Component>
  );
};

export default CustomRadio;

