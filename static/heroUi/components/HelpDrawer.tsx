"use client";

import React from "react";
import { Modal, Button, Link, Tooltip } from "@heroui/react";
import { useHelpDrawer } from "@/contexts/HelpDrawerContext";

export function HelpDrawer() {
  const { isOpen, onOpenChange, onClose } = useHelpDrawer();

  const handleClose = () => {
    onClose();
    onOpenChange(false);
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        variant="blur"
        className="sm:m-2 sm:rounded-medium"
      />
      <Modal.Container placement="bottom" size="full" className="sm:max-h-[85vh] sm:rounded-t-2xl">
        <Modal.Dialog className="bg-content1">
          <div className="flex flex-row gap-2 px-2 py-2 border-b border-default-200/50 justify-between bg-content1/50 backdrop-saturate-150 backdrop-blur-lg">
            <Tooltip>
              <Tooltip.Trigger>
                <Button
                  className="text-default-400 min-w-8 w-8 h-8 p-0"
                  size="sm"
                  variant="ghost"
                  onPress={handleClose}
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
              </Tooltip.Trigger>
              <Tooltip.Content>Close</Tooltip.Content>
            </Tooltip>
            <span className="font-semibold text-default-700">Help</span>
          </div>
          <div className="flex flex-col gap-4 py-4 pt-4 px-4 overflow-y-auto max-h-[70vh]">
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
        </Modal.Dialog>
      </Modal.Container>
    </Modal>
  );
}
