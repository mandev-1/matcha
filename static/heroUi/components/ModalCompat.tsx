"use client";

import React from "react";
import { Modal, useOverlayState } from "@heroui/react";

/**
 * HeroUI v3 compatibility: v2 Modal used isOpen, onClose, ModalContent, ModalHeader, ModalBody, ModalFooter.
 * This wrapper provides the v2 API. Passes overlay state to Modal root so backdrop and dialog stay in sync.
 */
export interface ModalCompatProps {
  isOpen: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  isDismissable?: boolean;
  hideCloseButton?: boolean;
  placement?: "center" | "top" | "bottom" | "left" | "right" | "auto";
  size?: "xs" | "sm" | "md" | "lg" | "cover" | "full";
  classNames?: { base?: string; header?: string; body?: string; footer?: string };
  children?: React.ReactNode;
}

export function ModalCompat({
  isOpen,
  onClose,
  onOpenChange,
  isDismissable = true,
  hideCloseButton,
  placement = "center",
  size = "md",
  classNames,
  children,
}: ModalCompatProps) {
  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      onOpenChange?.(open);
      if (!open) onClose?.();
    },
    [onClose, onOpenChange]
  );

  const state = useOverlayState({ isOpen, onOpenChange: handleOpenChange });

  // v3 Modal.Container placement is "auto" | "top" | "center" | "bottom" (no left/right)
  const placementProp: "auto" | "top" | "center" | "bottom" =
    placement === "left" || placement === "right" ? "center" : placement;

  return (
    <Modal state={state}>
      <Modal.Backdrop
        isDismissable={isDismissable}
        isKeyboardDismissDisabled={!isDismissable}
        className={classNames?.base}
      >
        <Modal.Container placement={placementProp} size={size}>
          <Modal.Dialog className={classNames?.base}>
            {children}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export function ModalContent({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function ModalHeader(props: React.ComponentProps<typeof Modal.Header>) {
  return <Modal.Header {...props} />;
}

export function ModalBody(props: React.ComponentProps<typeof Modal.Body>) {
  return <Modal.Body {...props} />;
}

export function ModalFooter(props: React.ComponentProps<typeof Modal.Footer>) {
  return <Modal.Footer {...props} />;
}
