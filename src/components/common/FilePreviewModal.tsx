import { type FC, useEffect, useRef, useState } from "react";
import { FileText, Download, X } from "lucide-react";
import { renderAsync as renderDocx } from "docx-preview";

export interface PreviewState {
  blob: Blob;
  blobUrl: string;
  filename: string;
  fileType: string;
}

const EXT_MAP: Record<string, string> = {
  pdf: "pdf", docx: "docx", doc: "docx",
  png: "img", jpg: "img", jpeg: "img", gif: "img", webp: "img", svg: "img",
  txt: "txt", csv: "txt",
};

export const getFileType = (name: string) =>
  EXT_MAP[name.split(".").pop()?.toLowerCase() ?? ""] ?? "unsupported";

const DocxViewer: FC<{ blob: Blob }> = ({ blob }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current)
      renderDocx(blob, ref.current, undefined, { className: "ssd-docx" }).catch(() => {});
  }, [blob]);
  return <div ref={ref} style={{ padding: "20px 32px", overflowY: "auto", height: "100%" }} />;
};

const TxtViewer: FC<{ blob: Blob }> = ({ blob }) => {
  const [text, setText] = useState("");
  useEffect(() => { blob.text().then(setText); }, [blob]);
  return (
    <pre style={{ margin: 0, padding: "20px 24px", overflowY: "auto", height: "100%", fontSize: "0.82rem", color: "#1e293b", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {text}
    </pre>
  );
};

const FilePreviewModal: FC<{ state: PreviewState; onClose: () => void }> = ({ state, onClose }) => {
  const { blob, blobUrl, filename, fileType } = state;

  const body =
    fileType === "pdf" ? (
      <iframe src={blobUrl} title={filename} style={{ width: "100%", height: "100%", border: "none" }} />
    ) : fileType === "img" ? (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "#f1f5f9" }}>
        <img src={blobUrl} alt={filename} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }} />
      </div>
    ) : fileType === "docx" ? (
      <DocxViewer blob={blob} />
    ) : fileType === "txt" ? (
      <TxtViewer blob={blob} />
    ) : (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
        <FileText size={48} color="#cbd5e1" />
        <div style={{ fontSize: "0.88rem", color: "#64748b" }}>Không hỗ trợ xem trực tiếp</div>
        <a href={blobUrl} download={filename} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 10, background: "linear-gradient(135deg,#1e3a8a,#2563eb)", color: "white", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none" }}>
          <Download size={13} /> Tải xuống
        </a>
      </div>
    );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(10,15,30,0.65)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 401, display: "flex", flexDirection: "column", padding: 20 }}>
        <div style={{ background: "white", borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, boxShadow: "0 30px 80px rgba(0,0,0,0.35)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "linear-gradient(135deg,#0f172a,#1e3a8a)", flexShrink: 0 }}>
            <FileText size={14} color="#93c5fd" />
            <span style={{ flex: 1, fontSize: "0.82rem", fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {filename}
            </span>
            <a href={blobUrl} download={filename} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: "0.72rem", fontWeight: 700, textDecoration: "none" }}>
              <Download size={11} /> Tải xuống
            </a>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>{body}</div>
        </div>
      </div>
    </>
  );
};

export default FilePreviewModal;
