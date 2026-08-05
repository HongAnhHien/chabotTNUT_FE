import { type FC, useState } from "react";
import { FileText, Eye, Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import StudentApi from "@/infra/student/student_api";
import type { IStudentSubjectFile } from "@/infra/api/interfaces/IStudent";
import type { PreviewState } from "@/components/common/FilePreviewModal";
import { getFileType } from "@/components/common/FilePreviewModal";
import { TYPE_STYLE, fmtSize } from "@/views/dashboard/student/subjects/subjectDetail.constants";

interface Props {
  file: IStudentSubjectFile;
  delay?: number;
  onPreview: (s: PreviewState) => void;
}

const SubjectFileCard: FC<Props> = ({ file, delay = 0, onPreview }) => {
  const ts = TYPE_STYLE[file.type] ?? TYPE_STYLE.khac;
  const [lv, setLv] = useState(false);
  const [ld, setLd] = useState(false);

  const fetchBlob = async (mode: "view" | "dl") => {
    const setL = mode === "view" ? setLv : setLd;
    setL(true);
    try {
      const { blob, filename } = await StudentApi.downloadFile(file.id);
      const url = URL.createObjectURL(blob);
      if (mode === "view") {
        onPreview({ blob, blobUrl: url, filename: file.original_name || filename, fileType: getFileType(file.original_name) });
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = file.original_name || filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch {
      toast.error("Không thể tải file.");
    } finally {
      setL(false);
    }
  };

  return (
    <div className="ssd-file-card" style={{ animationDelay: `${delay}s` }}>
      <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 12, background: ts.bg, border: `1px solid ${ts.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <FileText size={18} color={ts.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {file.original_name}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 3, alignItems: "center", flexWrap: "wrap" }}>
          {file.file_size ? <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{fmtSize(file.file_size)}</span> : null}
          {file.uploaded_by ? <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>· {file.uploaded_by}</span> : null}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button className="ssd-file-action view" onClick={() => fetchBlob("view")} disabled={lv || ld}>
          {lv ? <Loader2 size={11} style={{ animation: "ssd-spin 1s linear infinite" }} /> : <Eye size={11} />}
          <span className="btn-label">Xem</span>
        </button>
        <button className="ssd-file-action dl" onClick={() => fetchBlob("dl")} disabled={lv || ld}>
          {ld ? <Loader2 size={11} style={{ animation: "ssd-spin 1s linear infinite" }} /> : <Download size={11} />}
          <span className="btn-label">Tải</span>
        </button>
      </div>
    </div>
  );
};

export default SubjectFileCard;
