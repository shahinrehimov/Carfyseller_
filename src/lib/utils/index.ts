import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Export translation utilities
export { TranslationLoader, useTranslation } from "./translationLoader";
export { useTranslationStore } from "@/store/translations";

// Toast utility functions
export const showToast = {
  success: (message: string, options?: Parameters<typeof toast.success>[1]) => {
    return toast.success(message, options);
  },
  error: (message: string, options?: Parameters<typeof toast.error>[1]) => {
    return toast.error(message, options);
  },
  warning: (message: string, options?: Parameters<typeof toast.warning>[1]) => {
    return toast.warning(message, options);
  },
  info: (message: string, options?: Parameters<typeof toast>[1]) => {
    return toast.info(message, options);
  },
  loading: (message: string, options?: Parameters<typeof toast.loading>[1]) => {
    return toast.loading(message, options);
  },
  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    options: Parameters<typeof toast.promise>[1],
  ) => {
    return toast.promise(promise, options);
  },
};
