import { useRef } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface FileInputProps {
  file: { file?: File; url?: string };
  setFile: (file: { file?: File; url?: string }) => void;
  existingImage?: string | null;
  className?: string;
}

export function FileInput({
  file,
  setFile,
  existingImage = null,
  className,
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileType = selectedFile.name.split(".").pop()?.toLowerCase();
    const imageTypes = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"];

    if (!fileType || !imageTypes.includes(fileType)) {
      alert(`Accepted formats: ${imageTypes.join(", ")}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFile({
        file: selectedFile,
        url: reader.result as string,
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleRemove = () => {
    setFile({});
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const imageUrl = file.url || existingImage;

  return (
    <div
      className={cn(
        "relative flex min-h-[200px] w-full items-center justify-center rounded-lg border-2 border-dashed bg-muted/50",
        className
      )}
    >
      {imageUrl ? (
        <div className="relative flex h-full w-full items-center justify-center p-4">
          <img
            src={imageUrl}
            alt="Preview"
            className="max-h-[200px] max-w-full object-contain"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-6 hover:bg-muted/70">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Select or drag file
          </span>
        </label>
      )}
    </div>
  );
}
