"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

let openModalCount = 0;
let originalBodyOverflow = "";

export function ProviderModal({ children, titleId, descriptionId, onClose, className = "" }: {
  children: ReactNode;
  titleId: string;
  descriptionId?: string;
  onClose: () => void;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    if (openModalCount++ === 0) {
      originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      dialog.close();
      if (--openModalCount === 0) document.body.style.overflow = originalBodyOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <dialog ref={dialogRef} className={`provider-modal ${className}`} aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="provider-modal-body">{children}</div>
      <button type="button" className="provider-modal-close" aria-label="Zamknij" onClick={onClose}>
        <img src="/figma-assets/payment-methods/change-card/close.png" alt="" />
      </button>
    </dialog>
  );
}
