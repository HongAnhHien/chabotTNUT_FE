import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface Props {
  onSend: (content: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput = ({ onSend, isLoading = false, disabled = false, placeholder = 'Nhập câu hỏi hoặc yêu cầu tạo đề kiểm tra...' }: Props) => {
  const [text, setText] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

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

  const canSend = !!text.trim() && !isLoading && !disabled;

  return (
    <div style={{ borderTop: '1px solid rgba(30,58,138,0.08)', background: 'white', padding: '10px 16px 14px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
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
              padding: '10px 14px', borderRadius: 12,
              border: '1.5px solid rgba(30,58,138,0.15)',
              fontSize: '0.875rem', lineHeight: 1.5, color: '#1e293b',
              background: disabled ? '#f8faff' : 'white',
              transition: 'border .15s',
              maxHeight: 180, overflowY: 'auto',
              fontFamily: 'inherit',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.4)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(30,58,138,0.15)'; }}
          />
        </div>

        <button
          onClick={submit}
          disabled={!canSend}
          style={{
            flexShrink: 0, width: 40, height: 40, borderRadius: 10,
            background: canSend ? 'linear-gradient(135deg,#1e3a8a,#2563eb)' : 'rgba(37,99,235,0.08)',
            border: 'none', cursor: canSend ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .15s',
          }}
          title="Gửi (Enter)"
        >
          {isLoading
            ? <Loader2 size={16} color={canSend ? 'white' : '#94a3b8'} style={{ animation: 'spin 1s linear infinite' }} />
            : <Send size={16} color={canSend ? 'white' : '#94a3b8'} />
          }
        </button>
      </div>

      <p style={{ maxWidth: 860, margin: '5px auto 0', fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center' }}>
        <kbd style={{ padding: '1px 5px', background: '#f1f5f9', borderRadius: 4, fontSize: '0.6rem' }}>Enter</kbd> gửi &nbsp;·&nbsp;
        <kbd style={{ padding: '1px 5px', background: '#f1f5f9', borderRadius: 4, fontSize: '0.6rem' }}>Shift+Enter</kbd> xuống dòng
      </p>
    </div>
  );
};

export default ChatInput;
