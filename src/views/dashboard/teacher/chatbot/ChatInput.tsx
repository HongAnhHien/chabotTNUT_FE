import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface Props {
  onSend: (content: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: string[];
}

const ChatInput = ({
  onSend,
  isLoading = false,
  disabled = false,
  placeholder = 'Nhập câu hỏi cho trợ lý học tập...',
  suggestions,
}: Props) => {
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
    <div style={{ borderTop: '1px solid #eef0f5', background: 'white', padding: '10px 0 14px' }}>
      <style>{`
        .tai-suggest-scroll { scrollbar-width: none; }
        .tai-suggest-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      {/* Suggestion chips */}
      {suggestions && suggestions.length > 0 && (
        <div className="tai-suggest-scroll" style={{ display: 'flex', gap: 7, flexWrap: 'nowrap', overflowX: 'auto', marginBottom: 10, maxWidth: 860, margin: '0 auto 10px', padding: '0 16px' }}>
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => { setText(s); taRef.current?.focus(); }}
              style={{
                flexShrink: 0,
                padding: '5px 12px', borderRadius: 20, border: '1px solid #e2e8f0',
                background: '#f8fafc', color: '#475569', fontSize: '0.75rem', fontWeight: 500,
                cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#93c5fd'; (e.target as HTMLElement).style.background = '#eff6ff'; (e.target as HTMLElement).style.color = '#2563eb'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#e2e8f0'; (e.target as HTMLElement).style.background = '#f8fafc'; (e.target as HTMLElement).style.color = '#475569'; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'flex-end', gap: 8, padding: '0 16px' }}>
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
              transition: 'border .15s',
              maxHeight: 180, overflowY: 'auto',
              fontFamily: 'inherit',
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
            boxShadow: canSend ? '0 2px 8px rgba(37,99,235,0.28)' : 'none',
            transition: 'all .15s',
          }}
          title="Gửi (Enter)"
        >
          {isLoading
            ? <Loader2 size={16} color={canSend ? 'white' : '#94a3b8'} style={{ animation: 'spin 1s linear infinite' }} />
            : <Send size={16} color={canSend ? 'white' : '#94a3b8'} />
          }
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
