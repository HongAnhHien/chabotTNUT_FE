import { useEffect, useRef, useState } from 'react';
import { Bot, User, ArrowDown, Copy, Check, Trash2, CheckCircle, Eye, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import type { ChatMessage } from './types';

interface Props {
  messages: ChatMessage[];
  isStreaming?: boolean;
  onExamDismiss: (msgId: string) => void;
  onExamConfirm: (msgId: string) => void;
  onExamPreview: (msgId: string) => void;
}

const fmtTime = (d: Date) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const ChatContent = ({ messages, isStreaming = false, onExamDismiss, onExamConfirm, onExamPreview }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef    = useRef<HTMLDivElement>(null);
  const [showScroll,   setShowScroll]   = useState(false);
  const [copiedId,     setCopiedId]     = useState<string | null>(null);
  const [expandedIds,  setExpandedIds]  = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) =>
    setExpandedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  useEffect(() => {
    const timer = setTimeout(() => {
      const c = containerRef.current;
      if (!c) return;
      const nearBottom = c.scrollHeight - c.scrollTop - c.clientHeight < 120;
      if (nearBottom || messages.length <= 1 || isStreaming) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [messages, isStreaming]);

  const handleScroll = () => {
    const c = containerRef.current;
    if (!c) return;
    setShowScroll(c.scrollHeight - c.scrollTop - c.clientHeight > 200);
  };

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div ref={containerRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
          {messages.length === 0 && !isStreaming ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(30,58,138,0.1),rgba(37,99,235,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Bot size={32} color="#2563eb" />
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', marginBottom: 6 }}>Xin chào, Giảng viên!</div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', maxWidth: 360 }}>
                Tôi là <strong>TAI-TNUT</strong> — trợ lý AI tạo đề kiểm tra và hỗ trợ giảng dạy. Hãy đặt câu hỏi hoặc yêu cầu tạo đề!
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 860, margin: '0 auto', width: '100%', padding: '16px 16px 8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {messages.map(msg => {
                  // Tin bot đang stream: hiện typing indicator + nút dropdown xem live text
                  if (msg.role === 'assistant' && msg.isStreaming) {
                    const expanded = expandedIds.has(msg.id);
                    return (
                      <div key={msg.id} style={{ display: 'flex', gap: 10 }}>
                        <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, animation: 'pulse 1.5s ease infinite' }}>
                          <Bot size={15} color="white" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '80%' }}>
                          {/* Typing indicator row */}
                          <div style={{ padding: '10px 14px', borderRadius: '4px 16px 16px 16px', background: 'white', border: '1px solid rgba(37,99,235,0.08)', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              {[0, 1, 2].map(i => (
                                <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb', display: 'inline-block', animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
                              ))}
                            </div>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', flex: 1 }}>TAI đang soạn...</span>
                            {/* Dropdown toggle — luôn hiển thị, disable khi chưa có text */}
                            <button
                              onClick={() => msg.content && toggleExpand(msg.id)}
                              title={expanded ? 'Ẩn nội dung' : 'Xem nội dung đang tạo'}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 3,
                                padding: '2px 7px', borderRadius: 6,
                                background: expanded ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.05)',
                                border: '1px solid rgba(37,99,235,0.15)',
                                color: msg.content ? '#2563eb' : '#94a3b8',
                                fontSize: '0.68rem', fontWeight: 700,
                                cursor: msg.content ? 'pointer' : 'not-allowed',
                                flexShrink: 0, opacity: msg.content ? 1 : 0.5,
                              }}
                            >
                              <ChevronDown size={11} style={{ transition: 'transform .2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                              {expanded ? 'Ẩn' : 'Xem'}
                            </button>
                          </div>
                          {/* Live streaming text (expandable) */}
                          {expanded && msg.content && (
                            <div style={{ padding: '10px 14px', borderRadius: '4px 16px 16px 16px', background: 'white', border: '1px solid rgba(37,99,235,0.08)', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', fontSize: '0.875rem', lineHeight: 1.6, color: '#1e293b' }}>
                              <div className="prose prose-sm max-w-none" style={{ fontSize: '0.875rem' }}>
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                              <span style={{ display: 'inline-block', width: 6, height: 14, background: '#2563eb', borderRadius: 2, marginLeft: 2, animation: 'blink 0.7s step-start infinite', verticalAlign: 'middle' }} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                  <div key={msg.id}>
                    <div style={{ display: 'flex', gap: 10, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      {msg.role === 'assistant' && (
                        <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                          <Bot size={15} color="white" />
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                        {/* Bubble */}
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                          background: msg.role === 'user' ? 'linear-gradient(135deg,#1e3a8a,#2563eb)' : 'white',
                          color: msg.role === 'user' ? 'white' : '#1e293b',
                          boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
                          border: msg.role === 'assistant' ? '1px solid rgba(37,99,235,0.08)' : 'none',
                          fontSize: '0.875rem',
                          lineHeight: 1.6,
                        }}>
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-sm max-w-none" style={{ fontSize: '0.875rem' }}>
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                          )}
                        </div>

                        {/* Footer: time + copy */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, padding: '0 2px' }}>
                          {msg.role === 'assistant' && !msg.isStreaming && (
                            <button onClick={() => handleCopy(msg.content, msg.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px', borderRadius: 5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.68rem' }}
                              title="Sao chép"
                            >
                              {copiedId === msg.id ? <Check size={11} color="#059669" /> : <Copy size={11} />}
                            </button>
                          )}
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{fmtTime(msg.timestamp)}</span>
                        </div>

                        {/* Exam action buttons */}
                        {msg.role === 'assistant' && msg.examMeta && !msg.examMeta.dismissed && !msg.examMeta.confirmed && (
                          <div style={{ marginTop: 8, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                            <button
                              onClick={() => onExamDismiss(msg.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              <Trash2 size={12} /> Xóa
                            </button>
                            <button
                              onClick={() => onExamPreview(msg.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', color: '#d97706', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              <Eye size={12} /> Preview
                            </button>
                            <button
                              onClick={() => onExamConfirm(msg.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, background: 'linear-gradient(135deg,#059669,#10b981)', border: 'none', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              <CheckCircle size={12} /> Chấp nhận
                            </button>
                          </div>
                        )}
                        {msg.role === 'assistant' && msg.examMeta?.confirmed && (
                          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                            <CheckCircle size={12} /> Đã lưu đề kiểm tra
                          </div>
                        )}
                      </div>

                      {msg.role === 'user' && (
                        <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                          <User size={15} color="white" />
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}

                <div ref={bottomRef} style={{ height: 8 }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll to bottom */}
      {showScroll && (
        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <button
            onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
            style={{ pointerEvents: 'auto', width: 32, height: 32, borderRadius: '50%', background: 'white', border: '1px solid rgba(30,58,138,0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}
          >
            <ArrowDown size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatContent;
