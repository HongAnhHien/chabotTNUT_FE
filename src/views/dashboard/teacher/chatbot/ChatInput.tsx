import { useState, useRef, useEffect, type ComponentType } from 'react';
import toast from 'react-hot-toast';
import {
  Send, Loader2, Camera, Sigma,
  ListChecks, ListOrdered, StickyNote, LineChart, FileCheck, ClipboardList,
} from 'lucide-react';

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
  placeholder = 'Hỏi bài, chụp ảnh đề, hoặc gõ công thức Toán–Hóa…',
  suggestions,
  role = 'student',
}: Props) => {
  const [text, setText] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);
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
  const insertFormula = () => { setText(t => `${t}$$  $$`.trim() + ' '); taRef.current?.focus(); };

  const canSend = !!text.trim() && !isLoading && !disabled;

  return (
    <div style={{ borderTop: '1px solid #eef0f5', background: 'white', padding: '10px 0 14px' }}>
      <style>{`
        .tai-scroll { scrollbar-width: none; }
        .tai-scroll::-webkit-scrollbar { display: none; }
        .tai-tool:hover { border-color:#93c5fd !important; background:#eff6ff !important; color:#2563eb !important; }
        .tai-icobtn:hover { background:#eff6ff !important; color:#2563eb !important; }
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
        <div style={{ display: 'flex', gap: 2, alignItems: 'center', paddingBottom: 3 }}>
          <button className="tai-icobtn" title="Chụp/đính kèm ảnh đề (sắp có)"
            onClick={() => toast('Sắp có — chụp/đính kèm ảnh đề bài để hỏi.', { icon: '📷' })}
            style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', display: 'grid', placeItems: 'center', transition: 'all .15s' }}>
            <Camera size={18} />
          </button>
          <button className="tai-icobtn" title="Chèn công thức Toán–Hóa ($$ … $$)"
            onClick={insertFormula} disabled={disabled}
            style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: 'transparent', color: '#64748b', cursor: disabled ? 'not-allowed' : 'pointer', display: 'grid', placeItems: 'center', transition: 'all .15s' }}>
            <Sigma size={18} />
          </button>
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
