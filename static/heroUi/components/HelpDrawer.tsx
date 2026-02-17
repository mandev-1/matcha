"use client";

import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@heroui/drawer";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Tooltip } from "@heroui/tooltip";
import { useHelpDrawer } from "@/contexts/HelpDrawerContext";

export function HelpDrawer() {
  const { isOpen, onOpenChange, onClose } = useHelpDrawer();

  return (
    <Drawer
      hideCloseButton
      backdrop="blur"
      classNames={{
        base: "sm:data-[placement=right]:m-2 sm:data-[placement=left]:m-2 rounded-medium",
      }}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <DrawerContent>
        {(onCloseDrawer) => (
          <>
            <DrawerHeader className="absolute top-0 inset-x-0 z-50 flex flex-row gap-2 px-2 py-2 border-b border-default-200/50 justify-between bg-content1/50 backdrop-saturate-150 backdrop-blur-lg">
              <Tooltip content="Close">
                <Button
                  isIconOnly
                  className="text-default-400"
                  size="sm"
                  variant="light"
                  onPress={() => {
                    onCloseDrawer();
                    onClose();
                  }}
                >
                  <svg
                    fill="none"
                    height="20"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="m13 17 5-5-5-5M6 17l5-5-5-5" />
                  </svg>
                </Button>
              </Tooltip>
              <span className="font-semibold text-default-700">Help</span>
            </DrawerHeader>
            <DrawerBody className="pt-16">
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <span className="text-medium font-medium">Developer resources</span>
                  <div className="flex flex-col gap-2">
                    <Link
                      className="text-default-700 hover:text-primary"
                      href="/bot-activity"
                      onClick={onClose}
                    >
                      View Bot Activity Log →
                    </Link>
                    <Link
                      className="text-default-700 hover:text-primary"
                      href="/ranking"
                      onClick={onClose}
                    >
                      View Ranking →
                    </Link>
                  </div>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-default-700">
                  <li>
                    <Link
                      className="hover:text-primary"
                      href="/help/frequent-questions"
                      onClick={onClose}
                    >
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="hover:text-primary"
                      href="/help/golang-simulation"
                      onClick={onClose}
                    >
                      Simulating Activity
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="hover:text-primary"
                      href="/help/mafia"
                      onClick={onClose}
                    >
                      Fame Rating system
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="hover:text-primary"
                      href="/help/api_explanation"
                      onClick={onClose}
                    >
                      API
                    </Link>
                  </li>
                </ol>
                <p className="mt-4 text-default-400 italic text-sm">
                  Thanks for all the fish!
                </p>
              </div>
            </DrawerBody>
            <DrawerFooter />
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
