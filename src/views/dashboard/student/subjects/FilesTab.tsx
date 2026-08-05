import { type FC, useState } from "react";
import { FileText, Search } from "lucide-react";
import type { IStudentSubjectFile } from "@/infra/api/interfaces/IStudent";
import type { PreviewState } from "@/components/common/FilePreviewModal";
import SubjectFileCard from "@/components/student/SubjectFileCard";
import { TYPE_STYLE, TYPE_LABEL } from "./subjectDetail.constants";

interface Props {
  files: IStudentSubjectFile[];
  onPreview: (s: PreviewState) => void;
}

const FilesTab: FC<Props> = ({ files, onPreview }) => {
  const [search, setSearch] = useState("");

  if (files.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <FileText size={48} color="#e2e8f0" style={{ margin: "0 auto 12px", display: "block" }} />
        <div style={{ fontWeight: 700, color: "#1e293b" }}>Chưa có tài liệu</div>
        <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: 4 }}>
          Giảng viên chưa tải lên tài liệu cho môn học này.
        </div>
      </div>
    );
  }

  const filtered = files.filter(
    (f) => !search || (f.original_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, IStudentSubjectFile[]>>((acc, f) => {
    const k = f.type ?? "khac";
    (acc[k] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="ssd-file-search" style={{ position: "relative", maxWidth: 420 }}>
        <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input className="ssd-search" placeholder="Tìm kiếm tài liệu..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#94a3b8", fontSize: "0.85rem" }}>
          Không tìm thấy tài liệu phù hợp.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {Object.entries(grouped).map(([type, gfiles]) => {
            const ts = TYPE_STYLE[type] ?? TYPE_STYLE.khac;
            const label = TYPE_LABEL[type] ?? type;
            return (
              <div key={type}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: ts.bg, border: `1px solid ${ts.border}` }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: ts.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: ts.color, opacity: 0.7 }}>{gfiles.length} file</span>
                  </div>
                  <div style={{ height: 1, background: "rgba(30,58,138,0.07)", flex: 1 }} />
                </div>
                <div className="ssd-file-grid">
                  {gfiles.map((f, i) => (
                    <SubjectFileCard key={f.id} file={f} delay={i * 0.04} onPreview={onPreview} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FilesTab;
