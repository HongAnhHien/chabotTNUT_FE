import { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpenCheck, PlayCircle, ChevronLeft, ChevronRight, Pause, Play, Loader2, Maximize2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';
import BaiGiangApi from '@/infra/baigiang/baigiang_api';
import SlidePreview from '@/components/baigiang/SlidePreview';
import { stripForSpeech } from '@/components/learning/SpeakButton';
import type { IBaiGiang, IBaiGiangSummary } from '@/infra/api/interfaces/IBaiGiang';
import logoTNUT from '@/assets/logo_tnut/logo_tnut.png';

interface Props { maMon?: string | null; subjectName?: string | null }

type Mode = 'tomtat' | 'video';

/** Số chương để sắp xếp: "2" → 2, "2.1" → 2.1, chữ → cuối. */
const chapterNum = (c: string) => { const n = parseFloat(c); return Number.isFinite(n) ? n : 9999; };

/**
 * "Học cùng gia sư AI" — cửa sổ hiển thị ở màn chào mừng của chatbot môn học.
 *  · Tóm tắt bài giảng: slide từng chương, lật trái/phải.
 *  · Video tóm tắt chương: giáo viên AI đọc lời giảng (giọng AI) kèm slide chạy tự động.
 * Nguồn: bài giảng AI giảng viên ĐÃ DUYỆT của môn (dự án 26 nối Atlas).
 */
const LectureSummary: FC<Props> = ({ maMon, subjectName }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('tomtat');
  const [list, setList] = useState<IBaiGiangSummary[] | null>(null);
  const [chIdx, setChIdx] = useState(0);
  const [cache, setCache] = useState<Record<string, IBaiGiang>>({});
  const [loadingBai, setLoadingBai] = useState(false);
  const [slide, setSlide] = useState(0);

  // ── Danh sách bài giảng đã duyệt của môn ──
  useEffect(() => {
    setList(null); setChIdx(0); setSlide(0);
    if (!maMon) { setList([]); return; }
    BaiGiangApi.studentList(maMon)
      .then(r => setList([...(r.data ?? [])].sort((a, b) => chapterNum(a.chuong) - chapterNum(b.chuong))))
      .catch(() => setList([]));
  }, [maMon]);

  const cur = list?.[chIdx];
  const bai = cur ? cache[cur.id] : undefined;
  // Một chương có thể có nhiều bài giảng → đánh số "Bài n" để phân biệt.
  const sameCh = (list ?? []).filter(x => x.chuong === cur?.chuong);

  // ── Nạp nội dung chương đang chọn ──
  useEffect(() => {
    if (!cur || cache[cur.id]) return;
    setLoadingBai(true);
    BaiGiangApi.studentGet(cur.id)
      .then(r => setCache(c => ({ ...c, [cur.id]: r.data })))
      .catch(() => {})
      .finally(() => setLoadingBai(false));
  }, [cur?.id]);

  const goChapter = (d: number) => { if (!list) return; setChIdx(i => Math.min(Math.max(i + d, 0), list.length - 1)); setSlide(0); };

  const CARDS: { key: Mode; icon: typeof BookOpenCheck; title: string; desc: string; color: string; bg: string }[] = [
    { key: 'tomtat', icon: BookOpenCheck, title: 'Tóm tắt bài giảng', desc: 'Slide điểm chính từng chương, lật để ôn nhanh.', color: '#0e7c8a', bg: 'rgba(14,124,138,0.08)' },
    { key: 'video', icon: PlayCircle, title: 'Video tóm tắt chương', desc: 'Giáo viên AI giảng lại chương bằng giọng nói AI.', color: '#6d28d9', bg: 'rgba(109,40,217,0.08)' },
  ];

  return (
    <div style={{ flexShrink: 0, padding: '14px 16px 6px' }}>
      <style>{`
        @keyframes ls-pulse { 0%{box-shadow:0 0 0 0 rgba(109,40,217,.45)} 70%{box-shadow:0 0 0 12px rgba(109,40,217,0)} 100%{box-shadow:0 0 0 0 rgba(109,40,217,0)} }
        @keyframes ls-bar { 0%,100%{transform:scaleY(.3)} 50%{transform:scaleY(1)} }
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (prefers-reduced-motion: reduce) { .ls-anim { animation: none !important } }
      `}</style>

      {/* Tiêu đề */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Sparkles size={14} color="#6d28d9" />
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>
          Học cùng gia sư AI{subjectName ? <span style={{ fontWeight: 600, color: '#64748b' }}> · {subjectName}</span> : null}
        </span>
      </div>

      {/* 2 thẻ chọn chế độ */}
      <div role="tablist" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
        {CARDS.map(c => {
          const on = mode === c.key;
          return (
            <button key={c.key} role="tab" aria-selected={on} onClick={() => setMode(c.key)}
              style={{ textAlign: 'left', cursor: 'pointer', background: on ? c.bg : 'white', border: `1.5px ${on ? 'solid' : 'dashed'} ${on ? c.color : '#cbd5e1'}`,
                borderRadius: 14, padding: '11px 14px', display: 'flex', gap: 11, alignItems: 'flex-start', transition: 'all .15s' }}>
              <span style={{ width: 36, height: 36, borderRadius: 11, background: on ? c.color : c.bg, color: on ? 'white' : c.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <c.icon size={18} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>{c.title}</span>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginTop: 2, lineHeight: 1.45 }}>{c.desc}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Cửa sổ hiển thị */}
      <div style={{ marginTop: 10, background: 'white', border: '1px solid rgba(37,99,235,0.12)', borderRadius: 16, boxShadow: '0 6px 24px rgba(37,99,235,0.06)', padding: '12px 14px' }}>
        {list === null ? (
          <Empty><Loader2 size={18} className="ls-anim" style={{ animation: 'spin 1s linear infinite' }} /> Đang tải bài giảng của môn…</Empty>
        ) : list.length === 0 ? (
          <Empty>
            <b style={{ color: '#334155' }}>Môn này chưa có bài giảng tóm tắt.</b>
            <span>Khi giảng viên soạn và duyệt "Bài giảng AI" cho từng chương, slide và video tóm tắt sẽ hiện ở đây. Trong lúc chờ, em cứ hỏi gia sư AI ở ô chat bên dưới.</span>
          </Empty>
        ) : (
          <>
            {!bai ? (
              <Empty><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> {loadingBai ? 'Đang mở chương…' : 'Chưa mở được chương này.'}</Empty>
            ) : mode === 'tomtat' ? (
              <SlideDeck bai={bai} index={slide} setIndex={setSlide} onOpenFull={() => navigate(`/student/bai-giang/${bai.id}`)} />
            ) : (
              <AiTeacherVideo key={bai.id} bai={bai} index={slide} setIndex={setSlide} />
            )}

            {/* Điều hướng chương */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 }}>
              <button onClick={() => goChapter(-1)} disabled={chIdx === 0} aria-label="Chương trước" style={{ ...navBtn, opacity: chIdx === 0 ? 0.35 : 1 }}><ChevronLeft size={16} /></button>
              <div style={{ minWidth: 0, textAlign: 'center' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e3a8a', border: '1.5px solid #1e3a8a', borderRadius: 9, padding: '3px 14px', display: 'inline-block' }}>
                  Chương {cur?.chuong}{sameCh.length > 1 ? ` · Bài ${sameCh.indexOf(cur!) + 1}` : ''}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 3, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cur?.tieu_de} · {chIdx + 1}/{list.length}
                </div>
              </div>
              <button onClick={() => goChapter(1)} disabled={chIdx === list.length - 1} aria-label="Chương sau" style={{ ...navBtn, opacity: chIdx === list.length - 1 ? 0.35 : 1 }}><ChevronRight size={16} /></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ───────────── Tóm tắt: slide lật được ───────────── */
const SlideDeck: FC<{ bai: IBaiGiang; index: number; setIndex: (f: (i: number) => number) => void; onOpenFull: () => void }> = ({ bai, index, setIndex, onOpenFull }) => {
  const n = bai.noi_dung.slides.length;
  const i = Math.min(index, n - 1);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => setIndex(x => Math.max(x - 1, 0))} disabled={i === 0} aria-label="Slide trước" style={{ ...navBtn, opacity: i === 0 ? 0.35 : 1 }}><ChevronLeft size={16} /></button>
        <div style={{ flex: 1, maxWidth: 520, margin: '0 auto', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 10px rgba(15,23,42,0.1)' }}>
          <SlidePreview lec={bai.noi_dung} index={i} />
        </div>
        <button onClick={() => setIndex(x => Math.min(x + 1, n - 1))} disabled={i === n - 1} aria-label="Slide sau" style={{ ...navBtn, opacity: i === n - 1 ? 0.35 : 1 }}><ChevronRight size={16} /></button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: '0.72rem', color: '#64748b' }}>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>Slide {i + 1}/{n}</span>
        <div style={{ flex: 1, height: 4, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${((i + 1) / n) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#1B1F55,#FF7A00)', transition: 'width .2s' }} />
        </div>
        <button onClick={onOpenFull} style={{ ...linkBtn }}><Maximize2 size={12} /> Học đầy đủ + tự kiểm tra</button>
      </div>
    </div>
  );
};

/* ───────────── Video: giáo viên AI + giọng nói AI ───────────── */
const AiTeacherVideo: FC<{ bai: IBaiGiang; index: number; setIndex: (f: (i: number) => number) => void }> = ({ bai, index, setIndex }) => {
  const slides = bai.noi_dung.slides;
  const i = Math.min(index, slides.length - 1);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [playing, setPlaying] = useState(false);
  const [sent, setSent] = useState(0);
  const playingRef = useRef(false);
  const teacher = bai.noi_dung.meta?.giang_vien || 'Giảng viên';

  const sentences = useMemo(() => (slides[i]?.narration ?? []).map(p => p[0]).filter(Boolean), [slides, i]);

  const voice = useCallback((): SpeechSynthesisVoice | null => {
    const vs = window.speechSynthesis.getVoices();
    return vs.find(v => v.lang?.toLowerCase().startsWith('vi')) ?? vs.find(v => /vietnam/i.test(v.name)) ?? null;
  }, []);

  const stop = useCallback(() => { playingRef.current = false; setPlaying(false); if (supported) window.speechSynthesis.cancel(); }, [supported]);

  // Đọc câu thứ `s` của slide `i`; hết câu → sang slide sau; hết bài → dừng.
  const speak = useCallback((s: number) => {
    if (!playingRef.current) return;
    if (s >= sentences.length) {
      if (i < slides.length - 1) { setSent(0); setIndex(() => i + 1); } else stop();
      return;
    }
    setSent(s);
    const u = new SpeechSynthesisUtterance(stripForSpeech(sentences[s]));
    u.lang = 'vi-VN'; const v = voice(); if (v) u.voice = v; u.rate = 1;
    u.onend = () => speak(s + 1);
    u.onerror = () => { if (playingRef.current) speak(s + 1); };
    window.speechSynthesis.speak(u);
  }, [sentences, i, slides.length, setIndex, stop, voice]);

  // Slide đổi khi đang phát → đọc tiếp từ đầu slide mới.
  useEffect(() => {
    setSent(0);
    if (playingRef.current && supported) { window.speechSynthesis.cancel(); speak(0); }
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { playingRef.current = false; if (supported) window.speechSynthesis.cancel(); }, [supported]);

  const toggle = () => {
    if (!supported) return;
    if (playing) { stop(); return; }
    window.speechSynthesis.cancel();
    playingRef.current = true; setPlaying(true); speak(sent);
  };
  const jump = (d: number) => { window.speechSynthesis?.cancel(); setIndex(() => Math.min(Math.max(i + d, 0), slides.length - 1)); };

  const progress = ((i + (sentences.length ? sent / sentences.length : 0)) / slides.length) * 100;

  return (
    <div>
      <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto', borderRadius: 12, overflow: 'hidden', background: '#0f172a', boxShadow: '0 4px 18px rgba(15,23,42,0.2)' }}>
        <SlidePreview lec={bai.noi_dung} index={i} />

        {/* Giáo viên AI (góc phải dưới) */}
        <div style={{ position: 'absolute', right: '2.5%', bottom: '14%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div className="ls-anim" style={{ width: 62, height: 62, borderRadius: '50%', border: '3px solid white', overflow: 'hidden', background: 'white',
            animation: playing ? 'ls-pulse 1.4s infinite' : 'none', boxShadow: '0 2px 10px rgba(0,0,0,.25)' }}>
            <img src={logoTNUT} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', gap: 2, height: 12, alignItems: 'center' }} aria-hidden>
            {[0, 1, 2, 3, 4].map(k => (
              <span key={k} className="ls-anim" style={{ width: 3, height: 12, borderRadius: 2, background: '#FF7A00', transformOrigin: 'center',
                animation: playing ? `ls-bar .8s ${k * 0.12}s infinite ease-in-out` : 'none', transform: playing ? undefined : 'scaleY(.3)' }} />
            ))}
          </div>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'white', background: 'rgba(27,31,85,.85)', borderRadius: 6, padding: '1px 6px', whiteSpace: 'nowrap' }}>GV AI · {teacher}</span>
        </div>

        {/* Nút phát giữa khung khi đang dừng */}
        {!playing && supported && (
          <button onClick={toggle} aria-label="Phát video tóm tắt"
            style={{ position: 'absolute', inset: 0, margin: 'auto', width: 58, height: 58, borderRadius: '50%', border: 'none', background: 'rgba(109,40,217,.92)', color: 'white', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,.3)' }}>
            <Play size={26} style={{ marginLeft: 3 }} />
          </button>
        )}
      </div>

      {/* Phụ đề — nằm dưới slide, không che nội dung */}
      <div aria-live="polite" style={{ maxWidth: 560, margin: '6px auto 0', minHeight: 40, background: '#1e1b4b', color: 'white', fontSize: '0.76rem', lineHeight: 1.5, borderRadius: 8, padding: '6px 11px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        {sentences[sent] || <span style={{ color: '#a5b4fc' }}>Bấm ▶ để giáo viên AI bắt đầu giảng.</span>}
      </div>

      {/* Thanh điều khiển */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, maxWidth: 560, marginInline: 'auto' }}>
        <button onClick={() => jump(-1)} disabled={i === 0} aria-label="Đoạn trước" style={{ ...navBtn, opacity: i === 0 ? 0.35 : 1 }}><ChevronLeft size={15} /></button>
        <button onClick={toggle} disabled={!supported} aria-label={playing ? 'Tạm dừng' : 'Phát'} style={{ ...navBtn, background: '#6d28d9', color: 'white', borderColor: '#6d28d9' }}>
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button onClick={() => jump(1)} disabled={i === slides.length - 1} aria-label="Đoạn sau" style={{ ...navBtn, opacity: i === slides.length - 1 ? 0.35 : 1 }}><ChevronRight size={15} /></button>
        <div style={{ flex: 1, height: 4, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#6d28d9', transition: 'width .3s' }} />
        </div>
        <span style={{ fontSize: '0.72rem', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>{i + 1}/{slides.length}</span>
      </div>
      <div style={{ fontSize: '0.66rem', color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
        {supported ? 'Giọng đọc AI của trình duyệt (tiếng Việt). Giọng nhân bản của giảng viên sẽ bổ sung sau.' : 'Trình duyệt này chưa hỗ trợ giọng đọc — dùng Chrome hoặc Edge để nghe video.'}
      </div>
    </div>
  );
};

const Empty: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ minHeight: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.55, padding: '12px 20px', maxWidth: 460, margin: '0 auto' }}>
    {children}
  </div>
);

const navBtn: React.CSSProperties = { width: 32, height: 32, flexShrink: 0, borderRadius: 9, border: '1px solid #e2e8f0', background: 'white', color: '#334155', display: 'grid', placeItems: 'center', cursor: 'pointer' };
const linkBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', padding: 0 };

export default LectureSummary;
