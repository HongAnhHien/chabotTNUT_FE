import { useEffect, useState, type FC, type ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeft, TrendingUp, Loader2, Printer, MessageSquare, Users, FolderTree, GraduationCap, Clock, Sparkles } from "lucide-react";
import { useAuthStore, selectUser } from "@/views/pages/stores/auth_store";
import { ROLES, type Role } from "@/constants/roles";
import ImpactApi, { type IImpactReport } from "@/infra/impact/impact_api";
import StudentApi, { type IStudyStats, type ISubjectMastery } from "@/infra/student/student_api";

const GREEN = "#16a34a";

// ── Khối nhỏ dùng lại ─────────────────────────────────────────────
const Stat: FC<{ icon: ReactNode; value: ReactNode; label: string; sub?: ReactNode }> = ({ icon, value, label, sub }) => (
  <div style={{ flex: "1 1 190px", minWidth: 170, background: "#fff", border: "1px solid #e8edf3", borderRadius: 16, padding: "16px 18px", boxShadow: "0 1px 2px rgba(15,23,42,.04)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: 12.5, fontWeight: 600 }}>{icon}{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", marginTop: 6, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{sub}</div>}
  </div>
);

const Bars: FC<{ data: { label: string; value: number }[]; color?: string }> = ({ data, color = GREEN }) => {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, paddingTop: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600 }}>{d.value}</div>
          <div title={`${d.label}: ${d.value}`} style={{ width: "78%", height: `${(d.value / max) * 84}px`, minHeight: 3, background: `linear-gradient(180deg, ${color}, ${color}bb)`, borderRadius: "5px 5px 0 0" }} />
          <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
};

const MasteryRow: FC<{ name: string; pct: number | null; note?: string }> = ({ name, pct, note }) => (
  <div style={{ margin: "9px 0" }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
      <span style={{ color: "#334155", fontWeight: 500 }}>{name}</span>
      <span style={{ color: pct == null ? "#94a3b8" : "#0f172a", fontWeight: 700 }}>{pct == null ? note || "chưa có" : `${Math.round(pct)}%`}</span>
    </div>
    <div style={{ height: 8, background: "#eef2f7", borderRadius: 99 }}>
      <div style={{ width: `${pct ?? 0}%`, height: "100%", background: `linear-gradient(90deg, ${GREEN}, #22c55e)`, borderRadius: 99 }} />
    </div>
  </div>
);

const Card: FC<{ title: string; children: ReactNode; right?: ReactNode }> = ({ title, children, right }) => (
  <div style={{ background: "#fff", border: "1px solid #e8edf3", borderRadius: 16, padding: 18, boxShadow: "0 1px 2px rgba(15,23,42,.04)" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b" }}>{title}</div>
      {right}
    </div>
    {children}
  </div>
);

const Badge: FC<{ children: ReactNode; tone?: "amber" | "slate" | "green" }> = ({ children, tone = "slate" }) => {
  const c = tone === "amber" ? ["#b45309", "#fef3c7", "#fcd34d"] : tone === "green" ? ["#15803d", "#dcfce7", "#86efac"] : ["#475569", "#f1f5f9", "#cbd5e1"];
  return <span style={{ fontSize: 10.5, fontWeight: 700, color: c[0], background: c[1], border: `1px solid ${c[2]}`, borderRadius: 99, padding: "2px 8px", whiteSpace: "nowrap" }}>{children}</span>;
};

// ── Báo cáo cán bộ ────────────────────────────────────────────────
const StaffReport: FC<{ r: IImpactReport }> = ({ r }) => (
  <>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
      <Stat icon={<MessageSquare size={14} />} value={r.ai.questions_week.toLocaleString("vi")} label="Câu hỏi AI tuần này" sub={`${r.ai.questions_total.toLocaleString("vi")} tổng cộng`} />
      <Stat icon={<Users size={14} />} value={r.users.total.toLocaleString("vi")} label="Người dùng" sub={`${r.users.students} SV · ${r.users.teachers} GV`} />
      <Stat icon={<FolderTree size={14} />} value={r.structure.materials.toLocaleString("vi")} label="Học liệu trong kho" sub={`${r.structure.materials_ragged} đã nạp AI (RAG)`} />
      <Stat icon={<GraduationCap size={14} />} value={r.quiz.submissions.toLocaleString("vi")} label="Lượt làm quiz" sub={r.quiz.avg_score_pct != null ? `điểm TB ${r.quiz.avg_score_pct}%` : "chưa có bài"} />
    </div>

    {/* Giá trị mang lại */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12, marginBottom: 14 }}>
      <Card title="Giá trị ước tính" right={<Badge tone="amber">Ước tính</Badge>}>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
          <div><div style={{ fontSize: 26, fontWeight: 800, color: GREEN }}>{r.estimate.hours_saved_week}<small style={{ fontSize: 14 }}> g/tuần</small></div><div style={{ fontSize: 12, color: "#94a3b8" }}>thời gian tự mò tiết kiệm</div></div>
          <div><div style={{ fontSize: 26, fontWeight: 800, color: GREEN }}>{r.estimate.hours_saved_month}<small style={{ fontSize: 14 }}> g/tháng</small></div><div style={{ fontSize: 12, color: "#94a3b8" }}>gộp cả tháng</div></div>
        </div>
        <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 10 }}>{r.estimate.note}</div>
      </Card>
      <Card title="Chất lượng học tập">
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
          <div><div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{r.quiz.avg_score_pct != null ? `${r.quiz.avg_score_pct}%` : "—"}</div><div style={{ fontSize: 12, color: "#94a3b8" }}>điểm quiz trung bình</div></div>
          <div><div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{r.quiz.pass_rate != null ? `${r.quiz.pass_rate}%` : "—"}</div><div style={{ fontSize: 12, color: "#94a3b8" }}>tỉ lệ đạt (≥50%)</div></div>
          {r.quiz.improvement_pct != null && (
            <div><div style={{ fontSize: 26, fontWeight: 800, color: r.quiz.improvement_pct >= 0 ? GREEN : "#dc2626" }}>{r.quiz.improvement_pct >= 0 ? "+" : ""}{r.quiz.improvement_pct}%</div><div style={{ fontSize: 12, color: "#94a3b8" }}>cải thiện 30 ngày</div></div>
          )}
        </div>
      </Card>
      <Card title="Độ hài lòng người dùng" right={r.satisfaction != null ? <Badge tone="green">👍 số thật</Badge> : <Badge tone="amber">Chưa có phản hồi</Badge>}>
        {r.satisfaction != null ? (
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, color: GREEN }}>{r.satisfaction}<small style={{ fontSize: 15 }}>%</small></div>
            <div style={{ fontSize: 12.5, color: "#94a3b8" }}>thấy hữu ích · trên {r.satisfaction_n.toLocaleString("vi")} lượt phản hồi 👍/👎 trong khung chat</div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
            Chưa có lượt bấm 👍/👎 nào trong khung chat. Số hài lòng sẽ tự lên khi người dùng phản hồi câu trả lời của Trợ giảng AI.
          </div>
        )}
      </Card>
    </div>

    {/* Biểu đồ */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12, marginBottom: 14 }}>
      <Card title="Lượt hỏi AI · 7 ngày qua"><Bars data={r.ai.by_day.map((d) => ({ label: d.label, value: d.count }))} /></Card>
      <Card title="Lượt hỏi AI · theo tháng"><Bars data={r.ai.by_month.map((d) => ({ label: d.label, value: d.count }))} color="#0ea5e9" /></Card>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12 }}>
      <Card title="Hoạt động theo môn học">
        {r.activity_by_subject.length ? (() => {
          const max = Math.max(1, ...r.activity_by_subject.map((a) => a.count));
          return r.activity_by_subject.map((a) => <MasteryRow key={a.subject_id} name={a.name} pct={(a.count / max) * 100} note={`${a.count}`} />);
        })() : <div style={{ fontSize: 13, color: "#94a3b8" }}>Chưa có dữ liệu hỏi bài theo môn.</div>}
        <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 8 }}>Độ dài thanh = số câu hỏi tương đối giữa các môn.</div>
      </Card>
      <Card title="Cơ cấu học liệu">
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", padding: "4px 0" }}>
          {[["Khoa", r.structure.khoa], ["Bộ môn", r.structure.bo_mon], ["Học phần", r.structure.subjects], ["Tài liệu", r.structure.materials]].map(([k, v]) => (
            <div key={k as string}><div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{v as number}</div><div style={{ fontSize: 12, color: "#94a3b8" }}>{k as string}</div></div>
          ))}
        </div>
      </Card>
    </div>
  </>
);

// ── Hiệu quả cá nhân (SV) ─────────────────────────────────────────
const StudentImpact: FC<{ stats: IStudyStats | null; mastery: ISubjectMastery[] }> = ({ stats, mastery }) => {
  const totalQ = mastery.reduce((s, m) => s + (m.so_cau_hoi || 0), 0);
  const totalQuiz = mastery.reduce((s, m) => s + (m.so_quiz || 0), 0);
  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <Stat icon={<Sparkles size={14} />} value={stats?.streak ?? 0} label="Ngày học liên tục" />
        <Stat icon={<MessageSquare size={14} />} value={totalQ} label="Câu đã hỏi Trợ giảng" sub={`hôm nay ${stats?.today_count ?? 0}`} />
        <Stat icon={<GraduationCap size={14} />} value={totalQuiz} label="Bài quiz đã làm" />
        <Stat icon={<Clock size={14} />} value={stats?.week.do_chinh_xac != null ? `${stats.week.do_chinh_xac}%` : "—"} label="Độ chính xác tuần" sub={stats ? `${stats.week.so_voi_tuan_truoc >= 0 ? "+" : ""}${stats.week.so_voi_tuan_truoc}% so với tuần trước` : ""} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12 }}>
        <Card title="Mức thành thạo từng môn">
          {mastery.length ? mastery.map((m) => <MasteryRow key={m.ma_mon} name={m.ma_mon} pct={m.mastery} note="chưa học" />) : <div style={{ fontSize: 13, color: "#94a3b8" }}>Chưa có dữ liệu.</div>}
        </Card>
        <Card title="Hoạt động 7 ngày (bài quiz)">
          {stats?.week.bars?.length ? <Bars data={stats.week.bars.map((b) => ({ label: b.d, value: b.v }))} /> : <div style={{ fontSize: 13, color: "#94a3b8" }}>Chưa có hoạt động tuần này.</div>}
          <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 8 }}>Cứ hỏi bài đều mỗi ngày để giữ streak và tiến bộ.</div>
        </Card>
      </div>
    </>
  );
};

// ── Trang ─────────────────────────────────────────────────────────
const PlatformImpactPage: FC = () => {
  const user = useAuthStore(selectUser);
  const role = (user?.role as Role) ?? ROLES.STUDENT;
  const isStaff = role !== ROLES.STUDENT;

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<IImpactReport | null>(null);
  const [stats, setStats] = useState<IStudyStats | null>(null);
  const [mastery, setMastery] = useState<ISubjectMastery[]>([]);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (isStaff) {
          const rep = await ImpactApi.getHieuQua();
          if (alive) setReport(rep);
        } else {
          const [st, ms] = await Promise.all([StudentApi.getStudyStats(), StudentApi.getSubjectMastery()]);
          if (alive) { setStats(st.data); setMastery(Object.values(ms.data || {})); }
        }
      } catch {
        if (alive) setErr(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [isStaff]);

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(50rem 26rem at 90% -6%, rgba(22,163,74,.08), transparent 60%), linear-gradient(180deg,#f7f8fc,#eef1f8)" }}>
      {/* Khung header gradient */}
      <header style={{ position: "relative", overflow: "hidden", color: "#fff", background: "linear-gradient(135deg,#15803d 0%,#0e7490 100%)" }}>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <span style={{ display: "grid", placeItems: "center", height: 38, width: 38, borderRadius: 11, background: "rgba(255,255,255,.16)" }}><TrendingUp size={19} /></span>
            <div style={{ lineHeight: 1.25, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Đánh giá hiệu quả nền tảng</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.8)" }}>{isStaff ? "Báo cáo giá trị PIAI-TNUT mang lại · số liệu thật" : "Kết quả & hiệu quả học tập của em"}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isStaff && report && (
              <button onClick={() => window.print()} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,.25)", background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}><Printer size={15} /> Xuất báo cáo</button>
            )}
            <Link to="/atlas" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,.25)", background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}><ArrowLeft size={15} /> Về Atlas</Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "20px" }}>
        {isStaff && (
          <div style={{ marginBottom: 14 }}>
            <Badge tone="green">✓ Số liệu thật từ dữ liệu nền tảng — các số ước tính được ghi rõ (đúng kỷ luật A/B/C)</Badge>
          </div>
        )}

        {loading && <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", padding: 40, justifyContent: "center" }}><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Đang tổng hợp số liệu…</div>}

        {!loading && err && <div style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>Chưa lấy được dữ liệu. Thử lại sau.</div>}

        {!loading && !err && isStaff && report && <StaffReport r={report} />}
        {!loading && !err && !isStaff && <StudentImpact stats={stats} mastery={mastery} />}
      </main>
    </div>
  );
};

export default PlatformImpactPage;
