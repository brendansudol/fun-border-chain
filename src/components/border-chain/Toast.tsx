"use client";

import type { ToastState } from "@/lib/border-chain/types";

type ToastProps = {
  toast: ToastState;
};

export default function Toast({ toast }: ToastProps) {
  if (!toast) {
    return null;
  }

  return (
    <div aria-live="polite" className={`bc-toast bc-toast--${toast.kind}`} role="status">
      {toast.message}
    </div>
  );
}
