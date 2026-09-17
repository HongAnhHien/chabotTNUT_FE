import { useState, useRef, useEffect, type ComponentType } from 'react';
import toast from 'react-hot-toast';
import {
  Send, Loader2, Camera, Sigma, Mic,
  ListChecks, ListOrdered, StickyNote, LineChart, FileCheck, ClipboardList,
} from 'lucide-react';
import SymbolPicker from './SymbolPicker';
import OcrApi from '@/infra/ocr/ocr_api';

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
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recogRef = useRef<ISpeechRecognition | null>(null);
  const baseTextRef = useRef('');
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

  // Chèn đoạn LaTeX tại vị trí con trỏ. `$0` trong template = nơi đặt con trỏ sau khi chèn.
  const insertSnippet = (tpl: string) => {
    const ta = taRef.current;
    const caret = tpl.indexOf('$0');
    const clean = tpl.replace('$0', '');
    const start = ta?.selectionStart ?? text.length;
    const end = ta?.selectionEnd ?? text.length;
    const next = text.slice(0, start) + clean + text.slice(end);
    setText(next);
    const pos = start + (caret >= 0 ? caret : clean.length);
    requestAnimationFrame(() => { ta?.focus(); ta?.setSelectionRange(pos, pos); });
  };

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

  // Nhập bằng giọng nói (Web Speech API — Chrome/Edge). Đổ chữ vào ô chat theo thời gian thực.
  const toggleMic = () => {
    if (listening) { recogRef.current?.stop(); return; }
    if (!SpeechRecognitionCtor) {
      toast.error('Trình duyệt chưa hỗ trợ nói-thành-chữ. Hãy dùng Chrome hoặc Edge.');
      return;
    }
    const rec = new SpeechRecognitionCtor();
    rec.lang = 'vi-VN';
    rec.continuous = true;
    rec.interimResults = true;
    baseTextRef.current = text ? text + ' ' : '';
    rec.onresult = (e) => {
      let finalStr = '', interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalStr += r[0].transcript;
        else interim += r[0].transcript;
      }
      setText(baseTextRef.current + finalStr + interim);
    };
    rec.onerror = (ev) => {
      setListening(false);
      if (ev.error !== 'aborted' && ev.error !== 'no-speech') {
        toast.error(ev.error === 'not-allowed' ? 'Chưa cấp quyền micro.' : 'Lỗi thu âm, thử lại.');
      }
    };
    rec.onend = () => { setListening(false); taRef.current?.focus(); };
    recogRef.current = rec;
    rec.start();
    setListening(true);
    toast('Đang nghe… nói câu hỏi của em', { icon: '🎤' });
  };

  useEffect(() => () => { try { recogRef.current?.stop(); } catch { /* noop */ } }, []);

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
            onClick={() => setShowSymbols(v => !v)} disabled={disabled}
            style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: showSymbols ? '#eff6ff' : 'transparent', color: showSymbols ? '#2563eb' : '#64748b', cursor: disabled ? 'not-allowed' : 'pointer', display: 'grid', placeItems: 'center', transition: 'all .15s' }}>
            <Sigma size={18} />
          </button>
          <button className="tai-icobtn" title={listening ? 'Đang nghe — bấm để dừng' : 'Nói để nhập (Chrome/Edge)'}
            onClick={toggleMic} disabled={disabled}
            style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: listening ? '#fee2e2' : 'transparent', color: listening ? '#dc2626' : '#64748b', cursor: disabled ? 'not-allowed' : 'pointer', display: 'grid', placeItems: 'center', transition: 'all .15s', animation: listening ? 'tai-pulse 1.1s ease-in-out infinite' : 'none' }}>
            <Mic size={18} />
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
            onChange={e => setText(e.target.value)}
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
