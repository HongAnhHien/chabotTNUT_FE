import { type FC, useRef, useState } from "react";
import { Upload } from "lucide-react";

interface ImageDropZoneProps {
  onFiles: (files: FileList) => void;
  disabled?: boolean;
}

const ImageDropZone: FC<ImageDropZoneProps> = ({ onFiles, disabled }) => {
  const inputRef    = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    if (disabled) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) onFiles(files);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={[
          "w-full flex flex-col items-center gap-2.5 rounded-xl border-2 border-dashed py-7 transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B3F]/40",
          isDragging
            ? "border-[#2F6B3F] bg-[#2F6B3F]/10 text-[#2F6B3F] scale-[1.01]"
            : "border-border text-muted-foreground hover:border-[#2F6B3F]/60 hover:bg-[#2F6B3F]/5 hover:text-[#2F6B3F]",
          disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "",
        ].join(" ")}
      >
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
            isDragging ? "bg-[#2F6B3F]/15" : "bg-muted"
          }`}
        >
          <Upload className="h-5 w-5" />
        </div>
        <div className="text-center space-y-0.5 pointer-events-none">
          <p className="text-sm font-medium">
            {isDragging ? "Thả ảnh vào đây" : "Nhấn hoặc kéo thả ảnh vào đây"}
          </p>
          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP — nhiều ảnh cùng lúc</p>
          <p className="text-[11px] text-muted-foreground/70">
            1 file tối đa 12 MB · Tối đa 10 ảnh
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
};

export default ImageDropZone;
