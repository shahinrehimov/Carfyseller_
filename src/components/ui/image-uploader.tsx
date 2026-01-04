import { useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/utils/translationLoader";

const ASPECT_RATIOS: Record<string, number | undefined> = {
  "1:1": 1,
  "3:4": 3 / 4,
  "4:3": 4 / 3,
  "9:16": 9 / 16,
  "16:9": 16 / 9,
  custom: undefined,
};

interface FileData {
  file?: File | null | string;
  preview?: string;
}

interface FileInputProps {
  file: FileData;
  setFile: (file: FileData) => void;
}

function ImageUploader({ file, setFile }: FileInputProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [openCrop, setOpenCrop] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [tempImage, setTempImage] = useState<FileData | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileType = selectedFile.name.split(".").at(-1)?.toLowerCase();
    const imageTypes = ["png", "svg", "jpg", "jpeg", "avif", "gif"];

    if (fileType && imageTypes.includes(fileType)) {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = () => {
        setTempImage({
          file: selectedFile,
          preview: reader.result as string,
        });
        setOpenCrop(true);
        setCrop(undefined);
      };
      return;
    }
    setFile({});
    toast.error(`${t("accepted_formats")}: ${imageTypes.join(",")}`);
  };

  const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop) => {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return Promise.reject("Canvas context not available");

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    );

    return new Promise<FileData>((resolve) => {
      const originalType =
        tempImage?.file instanceof File ? tempImage?.file?.type : "image/jpeg";
      const fileExtension = originalType.split("/")[1];

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error("Canvas is empty");
            return;
          }
          const originalName =
            tempImage?.file instanceof File ? tempImage?.file?.name : "image";
          const nameWithoutExt = originalName.substring(
            0,
            originalName.lastIndexOf("."),
          );
          const newFileName = `${nameWithoutExt}-cropped.${fileExtension}`;

          const croppedFile = new File([blob], newFileName, {
            type: originalType,
          });
          resolve({
            file: croppedFile,
            preview: URL.createObjectURL(blob),
          });
        },
        originalType,
        1,
      );
    });
  };

  const handleSaveCrop = async () => {
    if (!imgRef.current) return;

    try {
      if (!crop) {
        setFile(tempImage || {});
        setOpenCrop(false);
        setTempImage(null);
        return;
      }

      const croppedImageData = await getCroppedImg(
        imgRef.current,
        crop as PixelCrop,
      );
      setFile(croppedImageData);
      setOpenCrop(false);
      setTempImage(null);
    } catch (e) {
      console.error("Error cropping image:", e);
      toast.error("Error cropping image");
    }
  };

  const handleRatioChange = (newRatio: string) => {
    setSelectedRatio(newRatio);
    if (crop) {
      setCrop(undefined);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(droppedFile);
      inputRef.current.files = dt.files;
      handleFileSelect({ target: { files: dt.files } } as any);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <div className="flex items-center flex-wrap justify-center bg-stone-50 relative">
        {file.file ? (
          <div className="relative w-full h-48 flex items-center justify-center">
            <img
              src={file.preview}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
            <button
              className="absolute top-2.5 right-2.5 bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => {
                setFile({});
                if (inputRef.current) inputRef.current.value = "";
              }}
              type="button"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        ) : (
          <label
            className="w-full min-h-48 border-2 border-dashed border-gray-300 rounded cursor-pointer flex items-center justify-center hover:border-gray-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={inputRef}
              id="file-input"
              type="file"
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <div className="text-center py-12">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
              <p className="font-semibold text-gray-700">
                {t("select_file_description")}
              </p>
            </div>
          </label>
        )}
      </div>

      {/* Crop Modal */}
      {openCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">
                {t("select_image")}
              </h2>
              <button
                onClick={() => setOpenCrop(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 flex flex-col items-center flex-1 min-h-0">
              {/* Aspect Ratio Buttons */}
              <div className="mb-6 flex flex-wrap gap-2 justify-center flex-shrink-0">
                {Object.keys(ASPECT_RATIOS).map((ratio) => (
                  <button
                    key={ratio}
                    className={`px-4 py-2 min-w-[70px] rounded font-medium transition-colors ${
                      selectedRatio === ratio
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => handleRatioChange(ratio)}
                    type="button"
                  >
                    {ratio}
                  </button>
                ))}
              </div>

              {/* Image Crop Area */}
              {tempImage?.preview && (
                <div className="w-full flex justify-center flex-1 min-h-0 overflow-auto">
                  <div className="flex items-center justify-center max-w-full max-h-full">
                    <ReactCrop
                      crop={crop}
                      onChange={setCrop}
                      aspect={ASPECT_RATIOS[selectedRatio]}
                    >
                      <img
                        ref={imgRef}
                        src={tempImage.preview}
                        alt="Crop preview"
                        className="max-w-full max-h-full object-contain"
                        style={{ maxHeight: "calc(90vh - 280px)" }}
                      />
                    </ReactCrop>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setOpenCrop(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors font-medium"
                type="button"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSaveCrop}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                type="button"
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ImageUploader;
