"use client";

import React from "react";
import { Modal, Button } from "@heroui/react";
import { Icon } from "@iconify/react";

interface ServerStatusModalProps {
  isOpen: boolean;
  onRetry: () => void;
}

export function ServerStatusModal({ isOpen, onRetry }: ServerStatusModalProps) {
  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={() => {}}
        isDismissable={false}
        isKeyboardDismissDisabled
        className="z-[9999]"
      />
      <Modal.Container placement="center" size="md">
        <Modal.Dialog className="bg-content1">
          <Modal.Header className="flex flex-col gap-1 items-center">
            <Icon icon="solar:server-path-bold" className="text-6xl text-warning mb-2" />
            <Modal.Heading>Uh oh!</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="text-center pb-6">
            <p className="text-default-600">
              Our server is taking a smokebreak, make sure its running.
            </p>
            <Button
              variant="secondary"
              onPress={onRetry}
              className="mt-4"
            >
              <Icon icon="solar:refresh-bold" className="mr-1" />
              Retry Connection
            </Button>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal>
  );
}
