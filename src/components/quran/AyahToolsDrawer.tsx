"use client";

import { useEffect } from "react";

export function AyahToolsDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      <button
        aria-label="Close Ayah Tools"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ayah Tools"
        className="absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t border-brand-200 dark:border-brand-800 bg-paper-light dark:bg-paper-dark shadow-2xl flex flex-col"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-brand-200 dark:bg-brand-800 shrink-0" />
        {children}
      </div>
    </div>
  );
}
