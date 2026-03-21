import { create } from "zustand";

interface CompanyNotVerifiedState {
  isOpen: boolean;
  message: string;
  show: (message: string) => void;
  hide: () => void;
}

export const useCompanyNotVerifiedStore = create<CompanyNotVerifiedState>()(
  (set) => ({
    isOpen: false,
    message: "",
    show: (message) => set({ isOpen: true, message }),
    hide: () => set({ isOpen: false }),
  }),
);
