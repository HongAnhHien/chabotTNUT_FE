import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Play,
} from "lucide-react";
import toast from "react-hot-toast";
import katex from "katex";
import "katex/dist/katex.min.css";
import StudentApi from "@/infra/student/student_api";
import type {
  IStudentAssignmentDetailResponse,
  IStudentQuestion,
  ISubmitResult,
} from "@/infra/api/interfaces/IAssignment";
import Modal from "@/components/common/Modal";

// ── LaTeX renderer ─────────────────────────────────────
const renderKatex = (src: string, display: boolean) => {
  try {
    return katex.renderToString(src, {
      throwOnError: false,
      displayMode: display,
      output: "html",
    });
  } catch {
    return src;
  }
};

// Split "text $inline$ more $$display$$ rest" into chunks
const parseLatex = (
  text: string,
): Array<{ type: "text" | "inline" | "display"; content: string }> => {
  const chunks: Array<{
    type: "text" | "inline" | "display";
    content: string;
  }> = [];
  // Match $$...$$ first, then $...$
  const re = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let last = 0,
    m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last)
      chunks.push({ type: "text", content: text.slice(last, m.index) });
    const raw = m[0];
    if (raw.startsWith("$$"))
      chunks.push({ type: "display", content: raw.slice(2, -2) });
    else chunks.push({ type: "inline", content: raw.slice(1, -1) });
    last = m.index + raw.length;
  }
  if (last < text.length)
    chunks.push({ type: "text", content: text.slice(last) });
  return chunks;
};

const LatexText: FC<{ text: string; style?: React.CSSProperties }> = ({
  text,
  style,
}) => {
  const chunks = parseLatex(text ?? "");
  return (
    <span style={style}>
      {chunks.map((c, i) =>
        c.type === "text" ? (
          <span key={i}>{c.content}</span>
        ) : (
          <span
            key={i}
            dangerouslySetInnerHTML={{
              __html: renderKatex(c.content, c.type === "display"),
            }}
          />
        ),
      )}
    </span>
  );
};

const CSS = `
  @keyframes sae-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sae-spin { to{transform:rotate(360deg)} }
  @keyframes sae-pulse { 0%,100%{opacity:1} 50%{opacity:.6} }
  .sae-opt {
    display:flex; align-items:flex-start; gap:10px; padding:10px 12px; border-radius:11px;
    cursor:pointer; transition:all .15s; border:2px solid transparent;
  }
  .sae-opt:hover { background: rgba(37,99,235,0.05); }
  .sae-opt.selected { border-color:#2563eb; background:rgba(37,99,235,0.06); }
  .sae-opt.correct  { border-color:#059669; background:rgba(5,150,105,0.07); }
  .sae-opt.wrong    { border-color:#dc2626; background:rgba(220,38,38,0.05); }
  .sae-opt.missed   { border-color:#059669; background:rgba(5,150,105,0.05); }
`;

const fmtDt = (s?: string | null) => {
  if (!s) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(s.replace(" ", "T")));
};

const pad = (n: number) => String(n).padStart(2, "0");
const fmtSeconds = (sec: number) =>
  `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;

const StudentAssignmentExam: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<
    IStudentAssignmentDetailResponse["data"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  // Đường quay lại tab "Bài kiểm tra" của đúng môn học (fallback về danh sách môn nếu chưa xác định được)
  const [backTo, setBackTo] = useState("/student/subjects");
  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<ISubmitResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitFsWarning, setShowExitFsWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);
  const hasSubmittedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const suppressFsWarnRef = useRef(false); // true when submit modal open or submitting
  const showExitFsWarningRef = useRef(false); // mirrors showExitFsWarning state
  const forceSubmitRef = useRef<() => void>(() => { });

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    StudentApi.getAssignmentDetail(id)
      .then((r) => {
        setDetail(r.data);
        if (r.data.my_submission) setStarted(true);
      })
      .catch(() => toast.error("Không thể tải bài kiểm tra."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]); // eslint-disable-line

  // Tra ma_mon của bài này (API chi tiết bài không trả ma_mon), rồi dò đúng học kỳ
  // mà môn đó thực sự thuộc về (không đoán theo học kỳ hiện tại/đầu danh sách, vì
  // môn học có thể thuộc 1 học kỳ khác — tra sai sẽ khiến trang chi tiết báo "không tìm thấy").
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    StudentApi.getAssignments()
      .then(async (asnRes) => {
        const maMon = (asnRes.data ?? []).find((a) => a.id === id)?.ma_mon;
        if (!maMon || cancelled) return;

        const semRes = await StudentApi.getSemesters();
        const current = semRes.data.hoc_ky_hien_tai;
        const hkList = current
          ? [current, ...semRes.data.ds_hoc_ky.map((s) => s.hoc_ky).filter((hk) => hk !== current)]
          : semRes.data.ds_hoc_ky.map((s) => s.hoc_ky);

        for (const hk of hkList) {
          const subRes = await StudentApi.getSubjectsBySemester(hk).catch(() => null);
          if (subRes?.data?.some((s) => s.ma_mon === maMon)) {
            if (!cancelled) setBackTo(`/student/subjects/${maMon}?tab=exams&hk=${hk}`);
            return;
          }
        }
        if (!cancelled) setBackTo(`/student/subjects/${maMon}?tab=exams`);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  // Keep refs in sync so the fullscreen listener always sees fresh values
  useEffect(() => {
    startedRef.current = started;
  }, [started]);
  useEffect(() => {
    hasSubmittedRef.current = !!detail?.my_submission;
  }, [detail]);
  // Suppress fullscreen-exit warning whenever the submit modal is open
  useEffect(() => { suppressFsWarnRef.current = showSubmitModal; }, [showSubmitModal]);
  // Mirror showExitFsWarning into ref so event listeners can read it without stale closure
  useEffect(() => { showExitFsWarningRef.current = showExitFsWarning; }, [showExitFsWarning]);

  // Show warning when fullscreen is exited while exam is active
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && startedRef.current && !hasSubmittedRef.current) {
        if (isSubmittingRef.current || suppressFsWarnRef.current) return;
        if (!showExitFsWarningRef.current) setShowExitFsWarning(true);
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
    };
  }, []);

  // Auto-submit immediately when student switches tab (visibilitychange)
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) return;
      if (!startedRef.current || hasSubmittedRef.current || isSubmittingRef.current) return;
      toast.error("Phát hiện chuyển tab — bài đã được nộp tự động.");
      forceSubmitRef.current();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Timer countdown — deps use minute-bucket to avoid restarting every second
  const timeMinuteBucket = timeLeft === null ? null : Math.floor(timeLeft / 60);
  const mySubmission = detail?.my_submission;
  useEffect(() => {
    if (timeLeft === null || !started || mySubmission) return;
    if (timeLeft <= 0) {
      forceSubmitRef.current();
      return;
    }
    timerRef.current = setInterval(
      () => setTimeLeft((prev) => (prev !== null ? prev - 1 : null)),
      1000,
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeMinuteBucket, mySubmission]);

  const handleStart = async () => {
    if (!id || starting) return;
    setStarting(true);
    try {
      await StudentApi.startAssignment(id);
      startedRef.current = true;
      setStarted(true);
      if (detail?.assignment.time_limit) {
        setTimeLeft(detail.assignment.time_limit * 60);
      }
      await document.documentElement.requestFullscreen().catch(() => { });
    } catch {
      toast.error("Không thể bắt đầu bài kiểm tra. Vui lòng thử lại.");
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    if (timerRef.current) clearInterval(timerRef.current);
    isSubmittingRef.current = true;
    suppressFsWarnRef.current = true;
    setSubmitting(true);
    try {
      const qs = detail?.questions ?? [];
      const r = await StudentApi.submitAssignment(id, {
        answers: qs
          .map((q) => ({ question_id: q.id, answer: answers[q.id] ?? "" }))
          .filter((a) => a.answer),
      });
      if (r.success) {
        toast.success(
          `Nộp thành công! Điểm: ${r.data?.score}/${r.data?.total}`,
        );
        if (r.data) setSubmitResult(r.data);
        hasSubmittedRef.current = true; // set immediately so fullscreenchange can't trigger warning
        setShowExitFsWarning(false);
        if (document.fullscreenElement)
          await document.exitFullscreen().catch(() => { });
        load();
      } else {
        toast.error(r.message ?? "Nộp thất bại.");
      }
    } catch {
      toast.error("Nộp thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
      suppressFsWarnRef.current = false;
    }
  };

  // Keep forceSubmitRef pointing at latest handleSubmit after every render
  useEffect(() => {
    forceSubmitRef.current = () => {
      handleSubmit();
    };
  }); // no deps — runs after every render so closure is always fresh

  const hasSubmitted = !!detail?.my_submission;

  const getOptClass = (q: IStudentQuestion, key: string): string => {
    if (!hasSubmitted)
      return answers[q.id] === key ? "sae-opt selected" : "sae-opt";
    const myAns = detail?.my_submission?.answers.find(
      (a) => a.question_id === q.id,
    )?.answer;
    if (key === q.answer) return "sae-opt correct";
    if (key === myAns && key !== q.answer) return "sae-opt wrong";
    return "sae-opt";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 40%,#f0fdf4 100%)",
      }}
    >
      <style>{CSS}</style>

      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg,#0f172a,#0369a1)",
          padding: "0 20px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            height: 56,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            onClick={() => navigate(backTo)}
            disabled={isFullscreen}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: isFullscreen ? "rgba(255,255,255,0.3)" : "white",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: isFullscreen ? "not-allowed" : "pointer",
            }}
          >
            <ArrowLeft size={13} /> Quay lại
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: "0.9rem",
                color: "white",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {detail?.assignment.title ?? "Bài kiểm tra"}
            </div>
          </div>
          {/* Timer */}
          {timeLeft !== null && !hasSubmitted && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 8,
                background:
                  timeLeft < 120
                    ? "rgba(220,38,38,0.25)"
                    : "rgba(255,255,255,0.12)",
                border: `1px solid ${timeLeft < 120 ? "rgba(220,38,38,0.4)" : "rgba(255,255,255,0.2)"}`,
              }}
            >
              <Clock
                size={13}
                color={timeLeft < 120 ? "#fca5a5" : "white"}
                style={
                  timeLeft < 120
                    ? { animation: "sae-pulse 1s ease infinite" }
                    : {}
                }
              />
              <span
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 800,
                  color: timeLeft < 120 ? "#fca5a5" : "white",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmtSeconds(timeLeft)}
              </span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "5rem" }}>
          <Loader2
            size={28}
            color="#0369a1"
            style={{
              animation: "sae-spin 1s linear infinite",
              margin: "0 auto 10px",
              display: "block",
            }}
          />
          <div style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
            Đang tải bài...
          </div>
        </div>
      ) : !detail ? (
        <div style={{ textAlign: "center", padding: "5rem", color: "#94a3b8" }}>
          Không tìm thấy bài kiểm tra.
        </div>
      ) : (
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: "20px 16px",
            display: "flex",
            gap: 20,
            alignItems: "flex-start",
          }}
        >
          {/* Main column */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Info card */}
            <div
              style={{
                background: "white",
                borderRadius: 14,
                border: "1px solid rgba(3,105,161,0.1)",
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "1rem",
                      color: "#1e293b",
                      marginBottom: 6,
                    }}
                  >
                    {detail.assignment.title}
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {detail.assignment.time_limit && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: "0.75rem",
                          color: "#64748b",
                        }}
                      >
                        <Clock size={12} /> {detail.assignment.time_limit} phút
                      </span>
                    )}
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      Hạn nộp: {fmtDt(detail.assignment.due_at)}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {detail.questions.length} câu hỏi
                    </span>
                  </div>
                  {detail.assignment.instructions && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: "8px 12px",
                        background: "rgba(3,105,161,0.05)",
                        borderRadius: 8,
                        fontSize: "0.78rem",
                        color: "#334155",
                        borderLeft: "3px solid #0369a1",
                      }}
                    >
                      {detail.assignment.instructions}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submitted banner */}
            {hasSubmitted && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  background: "rgba(5,150,105,0.08)",
                  border: "1px solid rgba(5,150,105,0.2)",
                  borderRadius: 11,
                }}
              >
                <CheckCircle size={16} color="#059669" />
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: "#059669",
                    fontWeight: 600,
                  }}
                >
                  Đã nộp lúc {fmtDt(detail.my_submission!.submitted_at)} — Xem
                  đáp án đúng/sai bên dưới
                </span>
              </div>
            )}

            {/* Submit result breakdown */}
            {submitResult && (
              <div
                style={{
                  background: "white",
                  borderRadius: 14,
                  border: "1px solid rgba(5,150,105,0.15)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "10px 16px",
                    background:
                      "linear-gradient(135deg,rgba(5,150,105,0.07),rgba(16,185,129,0.04))",
                    borderBottom: "1px solid rgba(5,150,105,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      color: "#059669",
                    }}
                  >
                    Kết quả nộp bài
                  </span>
                  <div style={{ display: "flex", gap: 16 }}>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      Điểm:{" "}
                      <strong style={{ color: "#059669" }}>
                        {submitResult.score}/{submitResult.total}
                      </strong>
                      <span
                        style={{
                          marginLeft: 6,
                          color: "#0369a1",
                          fontWeight: 600,
                        }}
                      >
                        ({submitResult.percent}%)
                      </span>
                    </span>
                    {submitResult.duration_seconds !== undefined && (
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "#64748b",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Clock size={12} />
                        {submitResult.duration_seconds < 60
                          ? `${submitResult.duration_seconds}s`
                          : `${Math.floor(submitResult.duration_seconds / 60)}p ${submitResult.duration_seconds % 60}s`}
                      </span>
                    )}
                  </div>
                </div>
                {submitResult.chapter_results &&
                  submitResult.chapter_results.length > 0 && (
                    <div
                      style={{
                        padding: "10px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {submitResult.chapter_results.map((ch) => {
                        const pct = Math.round(
                          (ch.correct / (ch.total || 1)) * 100,
                        );
                        return (
                          <div key={ch.chapter_id}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 4,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#334155",
                                  fontWeight: 500,
                                  flex: 1,
                                  minWidth: 0,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  paddingRight: 8,
                                }}
                              >
                                {ch.chapter_title}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  color:
                                    pct >= 70
                                      ? "#059669"
                                      : pct >= 40
                                        ? "#d97706"
                                        : "#dc2626",
                                  flexShrink: 0,
                                }}
                              >
                                {ch.correct}/{ch.total}
                              </span>
                            </div>
                            <div
                              style={{
                                height: 6,
                                borderRadius: 99,
                                background: "rgba(37,99,235,0.07)",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  borderRadius: 99,
                                  width: `${pct}%`,
                                  background:
                                    pct >= 70
                                      ? "#059669"
                                      : pct >= 40
                                        ? "#f59e0b"
                                        : "#dc2626",
                                  transition: "width .5s ease",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
            )}

            {detail.assignment.is_overdue && !hasSubmitted && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  background: "rgba(220,38,38,0.07)",
                  border: "1px solid rgba(220,38,38,0.2)",
                  borderRadius: 11,
                }}
              >
                <AlertTriangle size={16} color="#dc2626" />
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: "#dc2626",
                    fontWeight: 600,
                  }}
                >
                  Bài kiểm tra đã quá hạn nộp.
                </span>
              </div>
            )}

            {/* Questions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {detail.questions.map((q, idx) => {
                const myAns = detail.my_submission?.answers.find(
                  (a) => a.question_id === q.id,
                );
                const isCorrect = myAns?.is_correct;
                return (
                  <div
                    key={q.id}
                    id={`q-${q.id}`}
                    style={{
                      background: "white",
                      borderRadius: 14,
                      border: hasSubmitted
                        ? `1.5px solid ${isCorrect ? "rgba(5,150,105,0.2)" : myAns ? "rgba(220,38,38,0.2)" : "rgba(37,99,235,0.08)"}`
                        : "1px solid rgba(37,99,235,0.08)",
                      overflow: "hidden",
                      animation: "sae-fade .3s ease both",
                      animationDelay: `${idx * 0.03}s`,
                    }}
                  >
                    {/* Question header */}
                    <div
                      style={{
                        padding: "8px 14px",
                        background:
                          "linear-gradient(135deg,rgba(3,105,161,0.05),rgba(37,99,235,0.03))",
                        borderBottom: "1px solid rgba(37,99,235,0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            color: "#0369a1",
                            background: "rgba(3,105,161,0.1)",
                            borderRadius: 20,
                            padding: "1px 8px",
                          }}
                        >
                          Câu {idx + 1}
                        </span>
                        {q.chapter_title && (
                          <span
                            style={{ fontSize: "0.7rem", color: "#94a3b8" }}
                          >
                            {q.chapter_title}
                          </span>
                        )}
                      </div>
                      {hasSubmitted && myAns && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            color: isCorrect ? "#059669" : "#dc2626",
                          }}
                        >
                          {isCorrect ? (
                            <CheckCircle size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {isCorrect ? "Đúng" : "Sai"}
                        </span>
                      )}
                    </div>

                    {/* Question text */}
                    <div
                      style={{
                        padding: "12px 14px",
                        fontSize: "0.875rem",
                        color: "#1e293b",
                        lineHeight: 1.6,
                        borderBottom: "1px solid rgba(37,99,235,0.05)",
                      }}
                    >
                      <LatexText text={q.question} />
                    </div>

                    {/* Options */}
                    <div
                      style={{
                        padding: "10px 12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {Object.entries(q.options).map(([key, val]) => {
                        const optClass = getOptClass(q, key);
                        const isAnswer = key === q.answer;
                        const isMyWrong =
                          hasSubmitted && myAns?.answer === key && !isCorrect;
                        const circleColor = hasSubmitted
                          ? isAnswer
                            ? "#059669"
                            : isMyWrong
                              ? "#dc2626"
                              : "#cbd5e1"
                          : answers[q.id] === key
                            ? "#2563eb"
                            : "#475569";
                        return (
                          <div
                            key={key}
                            className={optClass}
                            onClick={() => {
                              if (
                                started &&
                                !hasSubmitted &&
                                !detail.assignment.is_overdue
                              )
                                setAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: key,
                                }));
                            }}
                          >
                            <span
                              style={{
                                flexShrink: 0,
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.7rem",
                                fontWeight: 800,
                                color: "white",
                                background: circleColor,
                              }}
                            >
                              {key}
                            </span>
                            <span
                              style={{
                                fontSize: "0.82rem",
                                color: hasSubmitted
                                  ? isAnswer
                                    ? "#059669"
                                    : isMyWrong
                                      ? "#dc2626"
                                      : "#64748b"
                                  : "#1e293b",
                                fontWeight:
                                  hasSubmitted && isAnswer ? 700 : 400,
                                flex: 1,
                                lineHeight: 1.45,
                              }}
                            >
                              <LatexText text={val as string} />
                            </span>
                            {hasSubmitted && isAnswer && (
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  color: "#059669",
                                  fontWeight: 800,
                                  whiteSpace: "nowrap",
                                  flexShrink: 0,
                                }}
                              >
                                ✓ Đáp án
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {hasSubmitted && q.explanation && (
                      <div
                        style={{
                          margin: "0 12px 12px",
                          padding: "8px 12px",
                          background: "rgba(3,105,161,0.05)",
                          borderRadius: 9,
                          fontSize: "0.75rem",
                          color: "#334155",
                          borderLeft: "3px solid #0369a1",
                          lineHeight: 1.5,
                        }}
                      >
                        <strong>Giải thích:</strong>{" "}
                        <LatexText text={q.explanation ?? ""} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* end main column */}

          {/* Question nav sidebar */}
          <div
            style={{
              width: 280,
              flexShrink: 0,
              position: "sticky",
              top: 72,
              maxHeight: "calc(100vh - 88px)",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: 14,
                border: "1px solid rgba(37,99,235,0.1)",
                padding: "14px 12px",
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#64748b",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Câu hỏi&nbsp;
                <span style={{ color: "#2563eb" }}>
                  {hasSubmitted
                    ? `${detail.my_submission!.score}/${detail.my_submission!.total}`
                    : `${Object.keys(answers).length}/${detail.questions.length}`}
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 5,
                }}
              >
                {detail.questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const subAns = detail.my_submission?.answers.find(
                    (a) => a.question_id === q.id,
                  );
                  const bg = hasSubmitted
                    ? subAns?.is_correct
                      ? "rgba(5,150,105,0.15)"
                      : subAns
                        ? "rgba(220,38,38,0.12)"
                        : "rgba(148,163,184,0.12)"
                    : isAnswered
                      ? "rgba(37,99,235,0.12)"
                      : "rgba(37,99,235,0.04)";
                  const color = hasSubmitted
                    ? subAns?.is_correct
                      ? "#059669"
                      : subAns
                        ? "#dc2626"
                        : "#94a3b8"
                    : isAnswered
                      ? "#2563eb"
                      : "#94a3b8";
                  const borderColor = hasSubmitted
                    ? subAns?.is_correct
                      ? "rgba(5,150,105,0.3)"
                      : subAns
                        ? "rgba(220,38,38,0.3)"
                        : "rgba(148,163,184,0.15)"
                    : isAnswered
                      ? "rgba(37,99,235,0.35)"
                      : "rgba(37,99,235,0.08)";
                  return (
                    <button
                      key={q.id}
                      onClick={() =>
                        document.getElementById(`q-${q.id}`)?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        })
                      }
                      title={`Câu ${idx + 1}`}
                      style={{
                        position: "relative",
                        aspectRatio: "1",
                        borderRadius: 7,
                        border: `1.5px solid ${borderColor}`,
                        background: bg,
                        color,
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {idx + 1}
                      {isAnswered && !hasSubmitted && (
                        <span
                          style={{
                            position: "absolute",
                            top: 1,
                            right: 2,
                            fontSize: 11,
                            color: "#059669",
                            lineHeight: 1,
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action button */}
            {!hasSubmitted && !detail.assignment.is_overdue && (
              <div style={{ marginTop: 10 }}>
                {!started ? (
                  <button
                    onClick={() => setShowStartModal(true)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "11px 0",
                      borderRadius: 12,
                      background: "linear-gradient(135deg,#059669,#10b981)",
                      border: "none",
                      color: "white",
                      fontSize: "0.82rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(5,150,105,0.3)",
                    }}
                  >
                    <Play size={15} /> Bắt đầu làm bài
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    disabled={submitting}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "11px 0",
                      borderRadius: 12,
                      background: submitting
                        ? "rgba(3,105,161,0.4)"
                        : "linear-gradient(135deg,#0369a1,#0ea5e9)",
                      border: "none",
                      color: "white",
                      fontSize: "0.82rem",
                      fontWeight: 800,
                      cursor: submitting ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 14px rgba(3,105,161,0.25)",
                    }}
                  >
                    {submitting ? (
                      <Loader2
                        size={15}
                        style={{ animation: "sae-spin 1s linear infinite" }}
                      />
                    ) : (
                      <Send size={15} />
                    )}
                    {submitting
                      ? "Đang nộp..."
                      : `Nộp bài (${Object.keys(answers).length}/${detail.questions.length})`}
                  </button>
                )}
              </div>
            )}

            {/* Exam rules */}
            <div
              style={{
                marginTop: 10,
                background: "white",
                borderRadius: 14,
                border: "1px solid rgba(217,119,6,0.25)",
                padding: "14px 12px",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: "#d97706",
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Quy định làm bài
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {[
                  "Màn hình sẽ vào chế độ toàn màn hình khi bắt đầu.",
                  "Thoát toàn màn hình sẽ hiện cảnh báo, nộp bài nếu xác nhận.",
                  "Chuyển sang tab khác sẽ tự động nộp bài ngay lập tức.",
                  "Câu bỏ trống tính 0 điểm. Hết giờ tự động nộp bài.",
                ].map((rule, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "rgba(217,119,6,0.13)",
                        color: "#d97706",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 1,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#475569",
                        lineHeight: 1.5,
                      }}
                    >
                      {rule}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start confirmation modal */}
      <Modal
        open={showStartModal}
        onClose={() => setShowStartModal(false)}
        title="Xác nhận bắt đầu làm bài"
        variant="warning"
        size="sm"
        closable={!starting}
        confirmText="Bắt đầu"
        cancelText="Hủy"
        confirmLoading={starting}
        onConfirm={async () => {
          await handleStart();
          setShowStartModal(false);
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Màn hình sẽ chuyển sang chế độ toàn màn hình.",
            "Thoát toàn màn hình sẽ hiện cảnh báo trước khi nộp bài.",
            "Chuyển sang tab khác sẽ tự động nộp bài ngay lập tức.",
            "Câu bỏ trống tính 0 điểm. Hết giờ tự động nộp bài.",
          ].map((rule, i) => (
            <div
              key={i}
              style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "rgba(217,119,6,0.12)",
                  color: "#d97706",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 1,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  fontSize: "0.82rem",
                  color: "#475569",
                  lineHeight: 1.5,
                }}
              >
                {rule}
              </span>
            </div>
          ))}
        </div>
      </Modal>

      {/* Fullscreen exit warning modal */}
      <Modal
        open={showExitFsWarning}
        onClose={() => { }}
        title="Cảnh báo: Thoát toàn màn hình"
        variant="danger"
        size="sm"
        closable={false}
        confirmText="Nộp bài ngay"
        cancelText="Quay lại làm bài"
        confirmLoading={submitting}
        onConfirm={async () => {
          setShowExitFsWarning(false);
          if (document.fullscreenElement)
            await document.exitFullscreen().catch(() => { });
          await handleSubmit();
        }}
        onCancel={() => {
          setShowExitFsWarning(false);
          document.documentElement.requestFullscreen().catch(() => { });
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              color: "#334155",
              lineHeight: 1.6,
            }}
          >
            Bạn đã thoát chế độ toàn màn hình. Nếu nộp bài sẽ{" "}
            <strong style={{ color: "#dc2626" }}>không thể hoàn tác</strong>.
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.82rem",
              color: "#64748b",
              lineHeight: 1.5,
            }}
          >
            Nhấn <strong>Quay lại làm bài</strong> để vào lại toàn màn hình và tiếp tục.
            Chú ý: chuyển sang tab khác sẽ tự động nộp bài.
          </p>
        </div>
      </Modal>

      {/* Submit confirmation modal */}
      {detail && (
        <Modal
          open={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          title="Xác nhận nộp bài"
          variant="info"
          size="sm"
          confirmText="Nộp bài"
          cancelText="Làm tiếp"
          confirmLoading={submitting}
          onConfirm={async () => {
            setShowSubmitModal(false);
            await handleSubmit();
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: "0.85rem", color: "#334155" }}>
              Bạn đã trả lời{" "}
              <strong style={{ color: "#0369a1" }}>
                {Object.keys(answers).length}/{detail.questions.length}
              </strong>{" "}
              câu hỏi.
            </div>
            {detail.questions.length - Object.keys(answers).length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  padding: "10px 12px",
                  background: "rgba(220,38,38,0.06)",
                  border: "1px solid rgba(220,38,38,0.18)",
                  borderRadius: 10,
                }}
              >
                <AlertTriangle
                  size={15}
                  color="#dc2626"
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#dc2626",
                    lineHeight: 1.5,
                  }}
                >
                  Còn{" "}
                  <strong>
                    {detail.questions.length - Object.keys(answers).length}
                  </strong>{" "}
                  câu chưa trả lời — các câu này sẽ được tính 0 điểm.
                </span>
              </div>
            )}
            <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
              Sau khi nộp bài sẽ không thể chỉnh sửa câu trả lời.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StudentAssignmentExam;
