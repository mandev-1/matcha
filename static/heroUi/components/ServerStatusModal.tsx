"use client";

import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";

interface ServerStatusModalProps {
  isOpen: boolean;
  onRetry: () => void;
}

export function ServerStatusModal({ isOpen, onRetry }: ServerStatusModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={() => {}} // Prevent closing
      isDismissable={false}
      hideCloseButton={true}
      size="md"
      placement="center"
      classNames={{ wrapper: "z-[9999]" }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 items-center">
          <Icon icon="solar:server-path-bold" className="text-6xl text-warning mb-2" />
          <h2 className="text-2xl font-bold">Uh oh!</h2>
        </ModalHeader>
        <ModalBody className="text-center pb-6">
          <p className="text-default-600">
            Our server is taking a smokebreak, make sure its running.
          </p>
          <Button
            color="primary"
            variant="flat"
            onPress={onRetry}
            className="mt-4"
            startContent={<Icon icon="solar:refresh-bold" />}
          >
            Retry Connection
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
