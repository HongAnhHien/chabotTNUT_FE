import { type FC, useEffect, useState } from 'react';
import { Flame, Check } from 'lucide-react';
import type { IStudentSubject } from '@/infra/api/interfaces/IStudent';
import StudentApi, { type ISubjectMastery } from '@/infra/student/student_api';

// Panel "Tiến độ học tập" bên phải khung chat SV — thể hiện cá nhân hoá học tập:
// streak · thống kê tuần · mức thành thạo từng môn · lộ trình hôm nay.
// Môn học lấy THẬT từ Portal; các chỉ số tiến độ hiện là DỮ LIỆU MẪU (mockup)
// cho tới khi có learning-analytics thật.

interface Props {
  subjects: IStudentSubject[];
}

function barColor(p: number): string {
  if (p >= 75) return '#0e8f63';
  if (p >= 60) return '#0e7c8a';
  if (p >= 48) return '#b4661a';
  return '#c0392b';
}

const WEEK = [
  { d: 'T2', v: 30 }, { d: 'T3', v: 52 }, { d: 'T4', v: 44 },
  { d: 'T5', v: 70 }, { d: 'T6', v: 38 }, { d: 'T7', v: 18 }, { d: 'CN', v: 86 },
];
const ROADMAP = [
  { t: 'Ổn định nghĩa đạo hàm', done: true },
  { t: 'Quy tắc chuỗi — lý thuyết', done: true },
  { t: 'Luyện 3 bài hàm hợp', done: false, tag: '~15p' },
  { t: 'Kiểm tra nhanh 5 câu', done: false, tag: '~8p' },
];

const Stat: FC<{ v: string; l: string; tone?: string }> = ({ v, l, tone }) => (
  <div style={{ background: '#f4f7fa', borderRadius: 11, padding: '9px 11px' }}>
    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: tone ?? '#0f172a', lineHeight: 1.1 }}>{v}</div>
    <div style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 600, marginTop: 1 }}>{l}</div>
  </div>
);

const StudyProgressPanel: FC<Props> = ({ subjects }) => {
  const [mst, setMst] = useState<Record<string, ISubjectMastery>>({});
  useEffect(() => {
    StudentApi.getSubjectMastery().then(r => setMst(r.data ?? {})).catch(() => {});
  }, []);
  const mastery = subjects.slice(0, 8).map(s => ({ ma: s.ma_mon, ten: s.ten_mon, info: mst[s.ma_mon] as ISubjectMastery | undefined }));

  return (
    <aside className="sai-progress">
      <style>{`
        .sai-progress{width:270px;flex-shrink:0;overflow-y:auto;background:#fbfdff;border-left:1px solid #e8eef3;padding:14px 14px 24px;display:flex;flex-direction:column;gap:14px;font-family:'Be Vietnam Pro',system-ui,sans-serif}
        .sai-card{background:#fff;border:1px solid #e8eef3;border-radius:16px;padding:14px}
        .sai-h{font-size:.64rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;margin:0 0 9px}
        @media (max-width:1180px){.sai-progress{display:none}}
      `}</style>

      <div style={{ fontSize: '0.6rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 20, padding: '3px 10px', alignSelf: 'flex-start', lineHeight: 1.4 }}>
        Mức thành thạo: <b style={{ color: '#0e8f63' }}>dữ liệu thật</b> · streak/tuần/lộ trình: mẫu
      </div>

      {/* Streak */}
      <div style={{ background: 'linear-gradient(135deg,#0e8f63,#12b981)', borderRadius: 16, padding: '16px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 24px -12px rgba(16,185,129,.5)' }}>
        <div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, lineHeight: 1 }}>12</div>
          <div style={{ fontSize: '0.74rem', opacity: 0.92, marginTop: 3 }}>ngày học liên tục</div>
        </div>
        <Flame size={30} color="#fff" fill="rgba(255,255,255,.35)" />
      </div>

      {/* Tuần này */}
      <div className="sai-card">
        <p className="sai-h">Tuần này</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Stat v="47" l="bài đã học" />
          <Stat v="86%" l="độ chính xác" tone="#0e8f63" />
          <Stat v="5g 20p" l="thời gian học" />
          <Stat v="+9%" l="so với tuần trước" tone="#0e7c8a" />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 5, marginTop: 12, height: 46 }}>
          {WEEK.map((w, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', maxWidth: 16, height: `${w.v}%`, minHeight: 4, borderRadius: 4, background: i === WEEK.length - 1 ? '#0e8f63' : '#cfe6e9' }} />
              <span style={{ fontSize: '0.56rem', color: '#94a3b8' }}>{w.d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mức thành thạo — THẬT: từ điểm quiz & số câu đã hỏi */}
      <div className="sai-card">
        <p className="sai-h">Mức thành thạo <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: '#0e8f63' }}>· từ quiz &amp; câu hỏi</span></p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mastery.length === 0 && <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Chưa có môn học.</div>}
          {mastery.map(m => {
            const p = m.info?.mastery ?? null;
            const soHoi = m.info?.so_cau_hoi ?? 0;
            const soQuiz = m.info?.so_quiz ?? 0;
            return (
              <div key={m.ma}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: 3, gap: 6 }}>
                  <span style={{ color: '#334155', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{m.ten}</span>
                  {p != null
                    ? <span style={{ color: barColor(p), fontWeight: 800, flexShrink: 0 }}>{p}%</span>
                    : <span style={{ color: '#94a3b8', fontSize: '0.68rem', flexShrink: 0 }}>{soHoi > 0 ? `đã hỏi ${soHoi} câu` : 'chưa học'}</span>}
                </div>
                <div style={{ height: 6, borderRadius: 99, background: '#eef2f6', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p ?? 0}%`, background: p != null ? barColor(p) : 'transparent', borderRadius: 99 }} />
                </div>
                {p != null && <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: 2 }}>{soQuiz} bài KT · {soHoi} câu hỏi</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lộ trình hôm nay */}
      <div className="sai-card">
        <p className="sai-h">Lộ trình hôm nay</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {ROADMAP.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, display: 'grid', placeItems: 'center', background: r.done ? '#0e8f63' : '#fff', border: r.done ? 'none' : '1.5px solid #cbd5e1' }}>
                {r.done && <Check size={12} color="#fff" strokeWidth={3} />}
              </span>
              <span style={{ flex: 1, fontSize: '0.78rem', color: r.done ? '#94a3b8' : '#334155', textDecoration: r.done ? 'line-through' : 'none' }}>{r.t}</span>
              {r.tag && <span style={{ fontSize: '0.62rem', color: '#94a3b8', background: '#f4f7fa', borderRadius: 20, padding: '2px 7px' }}>{r.tag}</span>}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default StudyProgressPanel;
