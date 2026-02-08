"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface HelpDrawerContextType {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
}

const HelpDrawerContext = createContext<HelpDrawerContextType | undefined>(undefined);

export function HelpDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);
  const onOpenChange = useCallback((open: boolean) => setIsOpen(open), []);

  return (
    <HelpDrawerContext.Provider value={{ isOpen, onOpen, onClose, onOpenChange }}>
      {children}
    </HelpDrawerContext.Provider>
  );
}

export function useHelpDrawer() {
  const context = useContext(HelpDrawerContext);
  if (context === undefined) {
    throw new Error("useHelpDrawer must be used within a HelpDrawerProvider");
  }
  return context;
}
