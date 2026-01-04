import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

import { useTranslation } from "@/lib/utils/translationLoader";

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder,
  className = "",
  minHeight = "200px",
}: RichTextEditorProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);
  const isInitialized = useRef(false);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || isInitialized.current) return;

    isInitialized.current = true;

    // Completely clear the container
    containerRef.current.innerHTML = "";

    // Create a fresh div for Quill
    const editorDiv = document.createElement("div");
    editorDiv.style.minHeight = minHeight;
    containerRef.current.appendChild(editorDiv);

    quillRef.current = new Quill(editorDiv, {
      theme: "snow",
      placeholder: placeholder || t("write_your_answer_here"),
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ align: [] }],
          ["link"],
          ["clean"],
        ],
      },
    });

    // Set initial value
    if (value) {
      quillRef.current.root.innerHTML = value;
    }

    // Set up onChange handler using ref to always get latest callback
    quillRef.current.on("text-change", () => {
      if (quillRef.current && onChangeRef.current) {
        const content = quillRef.current.root.innerHTML;
        onChangeRef.current(content);
      }
    });

    return () => {
      if (quillRef.current) {
        quillRef.current.off("text-change");
        quillRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      isInitialized.current = false;
    };
  }, []); // Empty dependency array - initialize only once

  // Update editor content when value prop changes
  useEffect(() => {
    if (quillRef.current) {
      const currentContent = quillRef.current.root.innerHTML;
      if (currentContent !== value) {
        quillRef.current.root.innerHTML = value;
      }
    }
  }, [value]);

  return (
    <div
      className={`w-full border border-border rounded-md overflow-hidden ${className}`}
    >
      <div ref={containerRef} />
    </div>
  );
}
