"use client";

import React from "react";
import { Button, Tooltip, ScrollShadow } from "@heroui/react";
import { Icon } from "@iconify/react";
import clsx from "clsx";

import PromptInput from "./prompt-input";

export default function Component() {
  const ideas = [
    {
      title: "Create a blog post about HeroUI",
      description: "explain it in simple terms",
    },
    {
      title: "Give me 10 ideas for my next blog post",
      description: "include only the best ideas",
    },
    {
      title: "Compare HeroUI with other UI libraries",
      description: "be as objective as possible",
    },
    {
      title: "Write a text message to my friend",
      description: "be polite and friendly",
    },
  ];

  const [prompt, setPrompt] = React.useState<string>("");

  return (
    <div className="flex w-full flex-col gap-4">
      <ScrollShadow hideScrollBar className="flex flex-nowrap gap-2" orientation="horizontal">
        <div className="flex gap-2">
          {ideas.map(({title, description}, index) => (
            <Button key={index} className="flex h-14 flex-col items-start gap-0" variant="secondary">
              <p>{title}</p>
              <p className="text-default-500">{description}</p>
            </Button>
          ))}
        </div>
      </ScrollShadow>
      <form className="rounded-medium bg-default-100 hover:bg-default-200/70 flex w-full flex-col items-start transition-colors">
        <div className="relative w-full">
          <PromptInput
            className="pt-1 pl-2 pb-6 pr-10 text-medium bg-transparent shadow-none min-h-[80px]"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            variant="secondary"
            rows={3}
          />
          <div className="absolute bottom-2 right-2">
            <Tooltip>
              <Tooltip.Trigger>
                <Button
                  className="min-w-8 w-8 h-8 p-0"
                  variant={!prompt ? "secondary" : "primary"}
                  isDisabled={!prompt}
                  size="sm"
                >
                  <Icon
                    className={clsx("[&>path]:stroke-[2px]", !prompt ? "text-default-600" : "text-primary-foreground")}
                    icon="solar:arrow-up-linear"
                    width={20}
                  />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>Send message</Tooltip.Content>
            </Tooltip>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 overflow-auto px-4 pb-4">
          <div className="flex w-full gap-1 md:gap-3">
            <Button size="sm" variant="secondary">
              <Icon className="text-default-500 mr-1" icon="solar:paperclip-linear" width={18} />
              Attach
            </Button>
            <Button size="sm" variant="secondary">
              <Icon className="text-default-500 mr-1" icon="solar:soundwave-linear" width={18} />
              Voice Commands
            </Button>
            <Button size="sm" variant="secondary">
              <Icon className="text-default-500 mr-1" icon="solar:notes-linear" width={18} />
              Templates
            </Button>
          </div>
          <p className="text-tiny text-default-400 py-1">{prompt.length}/2000</p>
        </div>
      </form>
    </div>
  );
}

