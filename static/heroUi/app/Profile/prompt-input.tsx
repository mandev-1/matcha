"use client";

import React from "react";
import { TextArea, type TextAreaProps } from "@heroui/react";
import clsx from "clsx";

const PromptInput = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, ...props }, ref) => {
    return (
      <TextArea
        ref={ref}
        aria-label="Prompt"
        className={clsx("min-h-[40px] py-0", className)}
        rows={1}
        placeholder="Enter a prompt here"
        {...props}
      />
    );
  },
);

export default PromptInput;

PromptInput.displayName = "PromptInput";

