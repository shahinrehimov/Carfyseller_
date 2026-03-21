import { ShieldAlert, X } from "lucide-react";
import { Button } from "./button";
import { useCompanyNotVerifiedStore } from "@/store/companyNotVerified";
import { useTranslation } from "@/lib/utils/translationLoader";

export function CompanyNotVerifiedModal() {
  const { isOpen, message, hide } = useCompanyNotVerifiedStore();
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative mx-4 w-full max-w-lg rounded-xl border border-amber-200 bg-white shadow-2xl dark:border-amber-800 dark:bg-gray-900">
        {/* Close button */}
        <button
          onClick={hide}
          className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center px-8 py-10 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <ShieldAlert className="h-10 w-10 text-amber-500" />
          </div>

          <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
            {t("company_not_verified_title", "Company Not Verified")}
          </h2>

          <p className="mb-8 text-base leading-relaxed text-gray-500 dark:text-gray-400">
            {message || t("company_not_verified_message", "Your company account has not been verified yet. Please wait for admin approval.")}
          </p>

          <Button onClick={hide} size="lg" className="min-w-[160px]">
            {t("ok_got_it", "OK, Got It")}
          </Button>
        </div>
      </div>
    </div>
  );
}
