import { Loader2 } from "lucide-react";
import { Button } from "./button";
import { useTranslation } from "@/lib/utils/translationLoader";

export default function DeleteModal({
  title,
  closeModal,
  handleDelete,
  pending,
}: {
  title?: string;
  closeModal: () => void;
  handleDelete: () => void;
  pending: boolean;
}) {
  const { t } = useTranslation();
  const modalTitle = t("delete_modal_title");
  return (
    <div className="space-y-4">
      <p>{title || modalTitle}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={closeModal}>
          {t("cancel")}
        </Button>
        <Button variant="destructive" onClick={handleDelete} disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("delete")}
        </Button>
      </div>
    </div>
  );
}
