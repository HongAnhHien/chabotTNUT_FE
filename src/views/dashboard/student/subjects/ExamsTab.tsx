import { type FC, useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import type { IStudentAssignmentListItem, ExamType } from "@/infra/api/interfaces/IAssignment";
import FilterDropdown, { type FilterOption } from "@/components/common/FilterDropdown";
import AssignmentRow from "@/components/student/AssignmentRow";
import { STATUS_CFG, EXAM_TYPE_CFG, EXAM_TYPE_FILTER, STATUS_FILTER, getStatusKey } from "./subjectDetail.constants";

interface Props {
  assignments: IStudentAssignmentListItem[];
}

const examTypeOptions: FilterOption[] = EXAM_TYPE_FILTER.map((o) => ({
  key: o.key,
  label: o.label,
  dot: o.key !== "all" ? EXAM_TYPE_CFG[o.key as ExamType].color : undefined,
}));

const statusOptions: FilterOption[] = STATUS_FILTER.map((o) => ({
  key: o.key,
  label: o.label,
  icon: o.key !== "all" ? STATUS_CFG[o.key as keyof typeof STATUS_CFG].icon : undefined,
}));

const ExamsTab: FC<Props> = ({ assignments }) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterExamType, setFilterExamType] = useState("all");

  const filtered = assignments.filter((a) => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || getStatusKey(a) === filterStatus;
    const matchType = filterExamType === "all" || a.exam_type === filterExamType;
    return matchSearch && matchStatus && matchType;
  });

  const hasFilter = search || filterStatus !== "all" || filterExamType !== "all";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Toolbar */}
      <div className="ssd-toolbar">
        <div className="ssd-search-wrap">
          <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input className="ssd-search" placeholder="Tìm kiếm bài kiểm tra..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <FilterDropdown options={examTypeOptions} value={filterExamType} onChange={setFilterExamType} minWidth={190} />
        <FilterDropdown options={statusOptions} value={filterStatus} onChange={setFilterStatus} minWidth={160} />
      </div>

      {hasFilter && (
        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
          Tìm thấy <strong style={{ color: "#1e293b" }}>{filtered.length}</strong> bài kiểm tra
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <ClipboardList size={44} color="#e2e8f0" style={{ margin: "0 auto 12px", display: "block" }} />
          <div style={{ fontWeight: 700, color: "#1e293b" }}>
            {assignments.length === 0 ? "Chưa có bài kiểm tra" : "Không tìm thấy kết quả"}
          </div>
          <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: 4 }}>
            {assignments.length === 0
              ? "Chưa có bài kiểm tra nào được giao cho môn học này."
              : "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((a, i) => (
            <AssignmentRow key={a.id} assignment={a} delay={i * 0.04} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamsTab;
