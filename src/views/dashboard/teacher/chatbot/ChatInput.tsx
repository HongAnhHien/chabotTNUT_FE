import { useState, useRef, useEffect, useLayoutEffect, type ComponentType } from 'react';
import toast from 'react-hot-toast';
import {
  Send, Loader2, Camera, Sigma, Mic,
  ListChecks, ListOrdered, StickyNote, LineChart, FileCheck, ClipboardList,
} from 'lucide-react';
import SymbolPicker from './SymbolPicker';
import OcrApi from '@/infra/ocr/ocr_api';
import SttApi from '@/infra/stt/stt_api';

// Web Speech API (Chrome/Edge) — không có sẵn trong type DOM mặc định
interface ISpeechRecognition {
  lang: string; continuous: boolean; interimResults: boolean;
  start: () => void; stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechCtor = new () => ISpeechRecognition;
const SpeechRecognitionCtor: SpeechCtor | undefined =
  (window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor })
    .SpeechRecognition ||
  (window as unknown as { webkitSpeechRecognition?: SpeechCtor }).webkitSpeechRecognition;

interface Props {
  onSend: (content: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: string[];
  role?: 'teacher' | 'student';
}

interface Tool { icon: ComponentType<{ size?: number }>; label: string; prompt: string }

const STUDENT_TOOLS: Tool[] = [
  { icon: ListOrdered, label: 'Giải từng bước', prompt: 'Giải chi tiết từng bước bài này giúp em: ' },
  { icon: ListChecks, label: 'Kiểm tra nhanh 5 câu', prompt: 'Tạo cho em 5 câu hỏi trắc nghiệm ôn tập nội dung vừa học, kèm đáp án.' },
  { icon: StickyNote, label: 'Thẻ ghi nhớ', prompt: 'Tạo thẻ ghi nhớ các công thức/khái niệm chính của chương này.' },
  { icon: LineChart, label: 'Vẽ đồ thị', prompt: 'Vẽ đồ thị hàm số: ' },
];

const TEACHER_TOOLS: Tool[] = [
  { icon: FileCheck, label: 'Chấm bài tự luận', prompt: 'Chấm bài tự luận sau và cho nhận xét theo thang điểm 10: ' },
  { icon: ClipboardList, label: 'Tạo đề kiểm tra', prompt: 'Tạo đề kiểm tra 10 câu cho chương này, kèm đáp án và ma trận đề.' },
  { icon: StickyNote, label: 'Tóm tắt chương', prompt: 'Tóm tắt nội dung chính của chương này thành các ý ngắn gọn, dễ giảng.' },
  { icon: LineChart, label: 'Vẽ đồ thị', prompt: 'Vẽ đồ thị hàm số: ' },
];

const ChatInput = ({
  onSend,
  isLoading = false,
  disabled = false,
  placeholder = 'Hỏi bài, chụp ảnh đề, nói, hoặc gõ công thức Toán–Hóa…',
  suggestions,
  role = 'student',
}: Props) => {
  const [text, setText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [showSymbols, setShowSymbols] = useState(false);
  const [listening, setListening] = useState(false);
  const [sttLoading, setSttLoading] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recogRef = useRef<ISpeechRecognition | null>(null);
  const baseTextRef = useRef('');
  const caretRef = useRef({ start: 0, end: 0 });
  const pendingCaretRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const webTextRef = useRef(''); // bản Web Speech tạm (xem trước + dự phòng nếu Whisper lỗi)
  const tools = role === 'teacher' ? TEACHER_TOOLS : STUDENT_TOOLS;

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = '44px';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
  }, [text]);

  const submit = () => {
    if (!text.trim() || isLoading || disabled) return;
    onSend(text.trim());
    setText('');
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };
  const prefill = (p: string) => { setText(p); taRef.current?.focus(); };

  // Ghi nhớ vị trí con trỏ mỗi khi nó thay đổi — để chèn đúng chỗ dù ô nhập mất/đổi focus.
  const rememberCaret = () => {
    const ta = taRef.current;
    if (ta) caretRef.current = { start: ta.selectionStart ?? 0, end: ta.selectionEnd ?? 0 };
  };

  // Chèn đoạn LaTeX tại vị trí con trỏ đã ghi nhớ. `$0` = nơi đặt con trỏ sau khi chèn.
  const insertSnippet = (tpl: string) => {
    const caret = tpl.indexOf('$0');
    const clean = tpl.replace('$0', '');
    const s = Math.min(caretRef.current.start, text.length);
    const e = Math.min(caretRef.current.end, text.length);
    const next = text.slice(0, s) + clean + text.slice(e);
    const pos = s + (caret >= 0 ? caret : clean.length);
    caretRef.current = { start: pos, end: pos };
    pendingCaretRef.current = pos; // useLayoutEffect sẽ đặt lại con trỏ sau khi DOM cập nhật
    setText(next);
  };

  // Sau khi React cập nhật value (controlled textarea đẩy con trỏ về cuối),
  // đặt lại con trỏ về đúng vị trí đã tính — chạy trước khi trình duyệt vẽ.
  useLayoutEffect(() => {
    const pos = pendingCaretRef.current;
    if (pos == null) return;
    pendingCaretRef.current = null;
    const ta = taRef.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(pos, pos);
    caretRef.current = { start: pos, end: pos };
  }, [text]);

  // Đọc ảnh đề (chụp hoặc chọn file) → text, đưa vào ô chat.
  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // cho phép chọn lại cùng 1 ảnh
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error('Ảnh quá lớn (tối đa 8MB).'); return; }
    setOcrLoading(true);
    const tid = toast.loading('Đang đọc ảnh đề…');
    try {
      const res = await OcrApi.extract(file);
      const ocr = res?.data?.text?.trim();
      if (res?.success && ocr) {
        setText(t => (t ? `${t}\n${ocr}` : ocr));
        toast.success('Đã đọc ảnh — kiểm tra lại rồi gửi nhé.', { id: tid });
        taRef.current?.focus();
      } else {
        toast.error(res?.message || 'Không đọc được nội dung trong ảnh.', { id: tid });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Đọc ảnh thất bại, thử lại sau.', { id: tid });
    } finally {
      setOcrLoading(false);
    }
  };

  // Bản xem trước tức thời bằng Web Speech (Chrome/Edge) — chạy song song lúc ghi âm,
  // cũng là bản dự phòng nếu Whisper không dùng được (chưa có khoá / lỗi mạng).
  const startWebSpeechPreview = () => {
    if (!SpeechRecognitionCtor) return;
    try {
      const rec = new SpeechRecognitionCtor();
      rec.lang = 'vi-VN'; rec.continuous = true; rec.interimResults = true;
      rec.onresult = (e) => {
        let s = '';
        for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript;
        webTextRef.current = s.trim();
        setText(baseTextRef.current + webTextRef.current);
      };
      rec.onerror = () => { /* im lặng — chỉ là bản xem trước */ };
      rec.onend = () => {};
      recogRef.current = rec;
      rec.start();
    } catch { /* noop */ }
  };

  // Nhập bằng giọng nói: ghi âm mic → Whisper (backend) nhận dạng chính xác → đổ vào ô chat.
  const toggleMic = async () => {
    if (listening) { // đang ghi → dừng để gửi Whisper
      try { recorderRef.current?.stop(); } catch { /* noop */ }
      try { recogRef.current?.stop(); } catch { /* noop */ }
      return;
    }
    // Không hỗ trợ ghi âm → lùi về Web Speech thuần (nếu có)
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      if (!SpeechRecognitionCtor) { toast.error('Trình duyệt chưa hỗ trợ thu âm. Hãy dùng Chrome hoặc Edge.'); return; }
      baseTextRef.current = text ? text + ' ' : '';
      startWebSpeechPreview();
      setListening(true);
      toast('Đang nghe… nói câu hỏi của em', { icon: '🎤' });
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error('Chưa cấp quyền micro cho trình duyệt.');
      return;
    }
    streamRef.current = stream;
    baseTextRef.current = text ? text + ' ' : '';
    webTextRef.current = '';
    chunksRef.current = [];

    const rec = new MediaRecorder(stream);
    rec.ondataavailable = (ev) => { if (ev.data.size > 0) chunksRef.current.push(ev.data); };
    rec.onstop = async () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setListening(false);
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
      if (blob.size < 1200) { toast('Chưa nghe rõ, thử lại nhé.', { icon: '🎤' }); return; }
      setSttLoading(true);
      const tid = toast.loading('Đang nhận dạng giọng nói…');
      try {
        const res = await SttApi.transcribe(blob, `audio.${(rec.mimeType || 'audio/webm').includes('ogg') ? 'ogg' : 'webm'}`);
        const stt = res?.data?.text?.trim();
        if (res?.success && stt) {
          setText(baseTextRef.current + stt);
          toast.success('Đã nhận dạng — kiểm tra rồi gửi nhé.', { id: tid });
        } else if (webTextRef.current) {
          setText(baseTextRef.current + webTextRef.current); // giữ bản xem trước
          toast('Dùng bản nghe nhanh của trình duyệt.', { id: tid, icon: '🎤' });
        } else {
          toast.error(res?.message || 'Không nhận dạng được giọng nói.', { id: tid });
        }
      } catch (err: unknown) {
        if (webTextRef.current) {
          setText(baseTextRef.current + webTextRef.current);
          toast('Dùng bản nghe nhanh của trình duyệt.', { id: tid, icon: '🎤' });
        } else {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          toast.error(msg || 'Nhận dạng giọng nói thất bại.', { id: tid });
        }
      } finally {
        setSttLoading(false);
        taRef.current?.focus();
      }
    };
    recorderRef.current = rec;
    rec.start();
    startWebSpeechPreview(); // xem trước tức thời trong lúc ghi
    setListening(true);
    toast('Đang ghi âm… bấm lại để dừng và nhận dạng', { icon: '🎤' });
  };

  useEffect(() => () => {
    try { recogRef.current?.stop(); } catch { /* noop */ }
    try { recorderRef.current?.stop(); } catch { /* noop */ }
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const canSend = !!text.trim() && !isLoading && !disabled;

  return (
    <div style={{ borderTop: '1px solid #eef0f5', background: 'white', padding: '10px 0 14px' }}>
      <style>{`
        .tai-scroll { scrollbar-width: none; }
        .tai-scroll::-webkit-scrollbar { display: none; }
        .tai-tool:hover { border-color:#93c5fd !important; background:#eff6ff !important; color:#2563eb !important; }
        .tai-icobtn:hover { background:#eff6ff !important; color:#2563eb !important; }
        @keyframes tai-pulse { 0%,100%{ box-shadow:0 0 0 0 rgba(220,38,38,.45);} 50%{ box-shadow:0 0 0 5px rgba(220,38,38,0);} }
      `}</style>

      {/* Suggestion chips (nếu có) */}
      {suggestions && suggestions.length > 0 && (
        <div className="tai-scroll" style={{ display: 'flex', gap: 7, overflowX: 'auto', maxWidth: 860, margin: '0 auto 8px', padding: '0 16px' }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => prefill(s)} className="tai-tool"
              style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 20, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Thanh tiện ích nhanh (theo vai) */}
      <div className="tai-scroll" style={{ display: 'flex', gap: 7, overflowX: 'auto', maxWidth: 860, margin: '0 auto 9px', padding: '0 16px' }}>
        {tools.map(t => (
          <button key={t.label} onClick={() => prefill(t.prompt)} disabled={disabled} className="tai-tool"
            style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: '0.75rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', transition: 'all .15s' }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Ô nhập + icon */}
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'flex-end', gap: 8, padding: '0 16px' }}>
        <div style={{ position: 'relative', display: 'flex', gap: 2, alignItems: 'center', paddingBottom: 3 }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onPickImage}
            style={{ display: 'none' }}
          />
          <button className="tai-icobtn" title="Chụp hoặc chọn ảnh đề → AI đọc thành chữ"
            onClick={() => fileRef.current?.click()} disabled={disabled || ocrLoading}
            style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: 'transparent', color: '#64748b', cursor: disabled || ocrLoading ? 'not-allowed' : 'pointer', display: 'grid', placeItems: 'center', transition: 'all .15s' }}>
            {ocrLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={18} />}
          </button>
          <button className="tai-icobtn" title="Chèn ký hiệu Toán – Hóa"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setShowSymbols(v => !v)} disabled={disabled}
            style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: showSymbols ? '#eff6ff' : 'transparent', color: showSymbols ? '#2563eb' : '#64748b', cursor: disabled ? 'not-allowed' : 'pointer', display: 'grid', placeItems: 'center', transition: 'all .15s' }}>
            <Sigma size={18} />
          </button>
          <button className="tai-icobtn" title={listening ? 'Đang ghi — bấm để dừng & nhận dạng' : 'Nói để nhập (Whisper)'}
            onClick={toggleMic} disabled={disabled || sttLoading}
            style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: listening ? '#fee2e2' : 'transparent', color: listening ? '#dc2626' : '#64748b', cursor: disabled || sttLoading ? 'not-allowed' : 'pointer', display: 'grid', placeItems: 'center', transition: 'all .15s', animation: listening ? 'tai-pulse 1.1s ease-in-out infinite' : 'none' }}>
            {sttLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Mic size={18} />}
          </button>
          {showSymbols && (
            <SymbolPicker
              onInsert={insertSnippet}
              onClose={() => setShowSymbols(false)}
            />
          )}
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={taRef}
            value={text}
            onChange={e => { setText(e.target.value); rememberCaret(); }}
            onKeyUp={rememberCaret}
            onClick={rememberCaret}
            onSelect={rememberCaret}
            onKeyDown={onKey}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            style={{
              width: '100%', resize: 'none', outline: 'none',
              padding: '11px 16px', borderRadius: 14,
              border: '1.5px solid #e2e8f0',
              fontSize: '0.875rem', lineHeight: 1.5, color: '#1e293b',
              background: disabled ? '#f8faff' : 'white',
              transition: 'border .15s', maxHeight: 180, overflowY: 'auto', fontFamily: 'inherit',
            }}
            onFocus={e => { e.target.style.borderColor = '#93c5fd'; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
          />
        </div>

        <button
          onClick={submit}
          disabled={!canSend}
          style={{
            flexShrink: 0, width: 42, height: 42, borderRadius: '50%',
            background: canSend ? 'linear-gradient(135deg,#2563eb,#3b82f6)' : '#f1f5f9',
            border: 'none', cursor: canSend ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: canSend ? '0 2px 8px rgba(37,99,235,0.28)' : 'none', transition: 'all .15s',
          }}
          title="Gửi (Enter)"
        >
          {isLoading
            ? <Loader2 size={16} color={canSend ? 'white' : '#94a3b8'} style={{ animation: 'spin 1s linear infinite' }} />
            : <Send size={16} color={canSend ? 'white' : '#94a3b8'} />}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
