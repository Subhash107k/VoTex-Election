import { useCallback, useState } from "react";

export type ToastType = "success" | "error";

export interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

export function useToast(timeoutMs = 4500) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback(
    (text: string, type: ToastType = "success") => {
      const id = Date.now();
      setToast({ id, text, type });

      window.setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
      }, timeoutMs);
    },
    [timeoutMs],
  );

  return { toast, showToast };
}
