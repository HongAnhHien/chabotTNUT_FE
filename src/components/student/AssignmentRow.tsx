import { type FC } from "react";
import { useNavigate } from "react-router";
import type { IStudentAssignmentListItem } from "@/infra/api/interfaces/IAssignment";
import { STATUS_CFG, EXAM_TYPE_CFG, getStatusKey, fmtDate } from "@/views/dashboard/student/subjects/subjectDetail.constants";

interface Props {
  assignment: IStudentAssignmentListItem;
  delay?: number;
}

const AssignmentRow: FC<Props> = ({ assignment: a, delay = 0 }) => {
  const navigate = useNavigate();
  const sk = getStatusKey(a);
  const cfg = STATUS_CFG[sk];
  const pct = a.my_score !== null && a.total ? Math.round((a.my_score / a.total) * 100) : null;
  const examTypeCfg = a.exam_type ? EXAM_TYPE_CFG[a.exam_type] : null;

  return (
    <div className="ssd-asgn-row" style={{ animationDelay: `${delay}s` }}>
      {/* Status icon */}
      <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color }}>
        {cfg.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {a.title}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
          {examTypeCfg && (
            <span style={{ fontSize: "0.62rem", fontWeight: 700, borderRadius: 20, padding: "2px 8px", background: examTypeCfg.bg, color: examTypeCfg.color, border: `1px solid ${examTypeCfg.border}` }}>
              {examTypeCfg.label}
            </span>
          )}
          <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Hạn nộp: {fmtDate(a.due_at)}</span>
          {a.submitted_at && (
            <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>· Đã nộp: {fmtDate(a.submitted_at)}</span>
          )}
        </div>
      </div>

      {/* Score */}
      {a.my_score !== null && a.total ? (
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 900, lineHeight: 1, color: pct! >= 80 ? "#059669" : pct! >= 50 ? "#d97706" : "#dc2626" }}>
            {a.my_score}/{a.total}
          </div>
          <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: 2 }}>{pct}%</div>
        </div>
      ) : null}

      {/* Status badge + action */}
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, borderRadius: 20, padding: "3px 10px", background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </span>
        {sk === "not_started" && (
          <button
            onClick={() => navigate(`/student/assignments/${a.id}`)}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 9, background: "linear-gradient(135deg,#2563eb,#3b82f6)", border: "none", color: "white", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.28)" }}
          >
            Làm bài
          </button>
        )}
      </div>
    </div>
  );
};

export default AssignmentRow;
