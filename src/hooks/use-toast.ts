
// This is a custom hook for managing toast notifications
import { useState } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
}

interface UseToastReturn {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { ...toast, id }]);
    
    // Auto-dismiss toast after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    addToast,
    removeToast,
  };
}

// Standalone toast function for easier usage
const toasts: Toast[] = [];
let setToastsCallback: (toasts: Toast[]) => void = () => {};

export const toast = {
  success: (title: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast = { id, title, variant: "default" as const };
    toasts.push(toast);
    setToastsCallback([...toasts]);
    setTimeout(() => {
      const index = toasts.findIndex((t) => t.id === id);
      if (index !== -1) {
        toasts.splice(index, 1);
        setToastsCallback([...toasts]);
      }
    }, 5000);
  },
  error: (title: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast = { id, title, variant: "destructive" as const };
    toasts.push(toast);
    setToastsCallback([...toasts]);
    setTimeout(() => {
      const index = toasts.findIndex((t) => t.id === id);
      if (index !== -1) {
        toasts.splice(index, 1);
        setToastsCallback([...toasts]);
      }
    }, 5000);
  },
  setToastsCallback: (callback: (toasts: Toast[]) => void) => {
    setToastsCallback = callback;
  },
};
