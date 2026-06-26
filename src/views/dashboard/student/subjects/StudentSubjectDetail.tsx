import { type FC, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, BookOpen, ClipboardList, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import StudentApi from "@/infra/student/student_api";
import type { IStudentSubject } from "@/infra/api/interfaces/IStudent";
import type { IStudentAssignmentListItem } from "@/infra/api/interfaces/IAssignment";
import FilePreviewModal, { type PreviewState } from "@/components/common/FilePreviewModal";
import FilesTab from "./FilesTab";
import ExamsTab from "./ExamsTab";
import CSS from "./subjectDetail.styles";

const StudentSubjectDetail: FC = () => {
  const navigate = useNavigate();
  const { maMon } = useParams<{ maMon: string }>();

  const [subject,     setSubject]     = useState<IStudentSubject | null>(null);
  const [assignments, setAssignments] = useState<IStudentAssignmentListItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [searchParams] = useSearchParams();
  const [tab,         setTab]         = useState<"files" | "exams">(searchParams.get("tab") === "exams" ? "exams" : "files");
  const [preview,     setPreview]     = useState<PreviewState | null>(null);

  useEffect(() => {
    if (!maMon) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const [semRes, asnRes] = await Promise.all([
          StudentApi.getSemesters(),
          StudentApi.getAssignments(),
        ]);
        const hk = semRes.data.hoc_ky_hien_tai;
        const subRes = await StudentApi.getSubjectsBySemester(hk);
        if (cancelled) return;
        const found = (subRes.data ?? []).find((s) => s.ma_mon === maMon);
        setSubject(found ? { ...found, files: found.files ?? [] } : null);
        setAssignments((asnRes.data ?? []).filter((a) => a.ma_mon === maMon));
      } catch {
        if (!cancelled) toast.error("Không thể tải dữ liệu môn học.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run().catch(() => {});
    return () => { cancelled = true; };
  }, [maMon]);

  if (loading) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#64748b", fontSize: "0.85rem" }}>
        <style>{CSS}</style>
        <Loader2 size={20} color="#2563eb" style={{ animation: "ssd-spin 1s linear infinite" }} />
        Đang tải môn học...
      </div>
    );
  }

  if (!subject) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <style>{CSS}</style>
        <AlertCircle size={48} color="#e2e8f0" />
        <div style={{ fontWeight: 700, color: "#1e293b" }}>Không tìm thấy môn học</div>
        <button onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 10, background: "rgba(37,99,235,0.08)", border: "1.5px solid rgba(37,99,235,0.18)", color: "#2563eb", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
          <ArrowLeft size={13} /> Quay lại
        </button>
      </div>
    );
  }

  const files = subject.files ?? [];

  return (
    <div style={{ minHeight: "100%", background: "#f4f6fb", display: "flex", flexDirection: "column" }}>
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div style={{ background: "white", borderBottom: "1px solid #eef0f5", boxShadow: "0 2px 8px rgba(30,58,138,0.05)", flexShrink: 0 }}>
        <div className="ssd-header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => navigate(-1)} style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, background: "rgba(37,99,235,0.06)", border: "1.5px solid rgba(37,99,235,0.14)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#2563eb", transition: "all .15s" }}>
              <ArrowLeft size={15} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {subject.ten_mon}
              </h1>
              <div className="ssd-meta">
                <span style={{ color: "#94a3b8", fontFamily: "monospace", fontWeight: 600 }}>{subject.ma_mon}</span>
                <span style={{ color: "#2563eb", fontWeight: 700 }}>{subject.so_tc} tín chỉ</span>
                {subject.gv    && <span style={{ color: "#64748b" }}>GV: {subject.gv}</span>}
                {subject.phong && <span style={{ color: "#64748b" }}>Phòng: {subject.phong}</span>}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="ssd-tab-bar">
            <button className={`ssd-tab${tab === "files" ? " active" : ""}`} onClick={() => setTab("files")}>
              <BookOpen size={14} />
              Tài liệu môn học
              {files.length > 0 && (
                <span style={{ fontSize: "0.65rem", fontWeight: 700, background: "rgba(37,99,235,0.1)", color: "#2563eb", borderRadius: 20, padding: "1px 7px" }}>
                  {files.length}
                </span>
              )}
            </button>
            <button className={`ssd-tab${tab === "exams" ? " active" : ""}`} onClick={() => setTab("exams")}>
              <ClipboardList size={14} />
              Bài kiểm tra
              {assignments.length > 0 && (
                <span style={{ fontSize: "0.65rem", fontWeight: 700, background: "rgba(37,99,235,0.1)", color: "#2563eb", borderRadius: 20, padding: "1px 7px" }}>
                  {assignments.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="ssd-content">
        {tab === "files" && <FilesTab files={files} onPreview={setPreview} />}
        {tab === "exams" && <ExamsTab assignments={assignments} />}
      </div>

      {preview && (
        <FilePreviewModal
          state={preview}
          onClose={() => { URL.revokeObjectURL(preview.blobUrl); setPreview(null); }}
        />
      )}
    </div>
  );
};

export default StudentSubjectDetail;
