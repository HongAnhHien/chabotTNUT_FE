import { type FC } from 'react';
import { RefreshCw, Bot, Eye, X, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import type { ISubjectFile } from '@/infra/api/interfaces/ITeacher';
import { TYPE_LABEL, POLLING_STATUSES } from '../constants';
import { fmtSize } from '../helpers';
import { ExtBadge, StatusBadge, Spinner } from './shared';

interface Props {
  files: ISubjectFile[];
  working: Record<string, boolean>;
  onRefresh: () => void;
  onPreview: (f: ISubjectFile) => void;
  onCancel: (id: string) => void;
  onRetry:  (id: string) => void;
  onDelLink:(id: string) => void;
  onDocs: () => void;
}

const TrainTab: FC<Props> = ({ files, working, onRefresh, onPreview, onCancel, onRetry, onDelLink, onDocs }) => {
  const trainFiles = files.filter(f => f.external_status != null);
  const needPoll   = files.some(f => POLLING_STATUSES.includes((f.external_status ?? null) as (typeof POLLING_STATUSES)[number]));

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>Hàng đợi huấn luyện AI</div>
        {needPoll && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12.5, fontWeight:600, color:'#d97706', background:'#fff7ed', padding:'4px 11px', borderRadius:999 }}>
            <Loader2 size={12} style={{ animation:'tdf-spin 1s linear infinite' }} /> Đang xử lý
          </span>
        )}
        <button onClick={onRefresh} style={{ marginLeft:'auto', height:38, padding:'0 15px', borderRadius:11, border:'1px solid #e7ecf3', background:'#fff', color:'#334155', fontWeight:600, fontSize:13, fontFamily:'inherit', display:'flex', alignItems:'center', gap:7, cursor:'pointer' }}>
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {trainFiles.length === 0 ? (
        <div style={{ background:'#fff', border:'1px solid #e7ecf3', borderRadius:16, padding:'4rem 1rem', textAlign:'center' }}>
          <Bot size={44} color="#c4b5fd" style={{ margin:'0 auto 12px', display:'block' }} />
          <div style={{ fontSize:15, fontWeight:700, color:'#1e293b' }}>Chưa có file nào gửi AI</div>
          <div style={{ fontSize:13, color:'#94a3b8', marginTop:5 }}>
            Sang tab <span style={{ fontWeight:700, color:'#2563eb', cursor:'pointer' }} onClick={onDocs}>Tài liệu</span> → chọn file → bấm <strong style={{ color:'#7c3aed' }}>Gửi AI</strong>
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {trainFiles.map(f => {
            const name = f.original_name ?? '—';
            const st   = f.external_status;
            return (
              <div key={f.id} style={{ background:'#fff', border:'1px solid #e7ecf3', borderRadius:14, padding:'14px 17px', display:'flex', alignItems:'center', gap:14 }}>
                <ExtBadge name={name} size={40} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
                  <div style={{ fontSize:11.5, color:'#94a3b8', marginTop:3 }}>{TYPE_LABEL[f.type]} · {fmtSize(f.file_size)}</div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                  <StatusBadge status={st ?? null} />

                  {st === 'parsed' && (
                    <button onClick={() => onPreview(f)} style={{ height:36, padding:'0 14px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#4f46e5,#4338ca)', color:'#fff', fontWeight:700, fontSize:12.5, fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                      <Eye size={13} /> Xem & gửi
                    </button>
                  )}

                  {st === 'send_queued' && (
                    <button onClick={() => onCancel(f.id)} disabled={!!working[f.id]} style={OUTLINE_BTN('#fecaca','#dc2626')}>
                      {working[f.id] ? <Spinner size={12} color="#dc2626" /> : <X size={12} />} Hủy
                    </button>
                  )}

                  {st === 'failed' && (
                    <button onClick={() => onRetry(f.id)} disabled={!!working[f.id]} style={OUTLINE_BTN('#fed7aa','#d97706')}>
                      {working[f.id] ? <Spinner size={12} color="#d97706" /> : <RefreshCw size={12} />} Thử lại
                    </button>
                  )}

                  {/* Delete from AI — available for all statuses */}
                  <button
                    onClick={() => onDelLink(f.id)}
                    disabled={!!working[f.id]}
                    title="Xóa khỏi AI"
                    style={OUTLINE_BTN('#fecaca', '#dc2626')}
                  >
                    {working[f.id]
                      ? <Spinner size={12} color="#dc2626" />
                      : st === 'success'
                        ? <><Trash2 size={12} /> Xóa AI</>
                        : <><AlertTriangle size={12} /> Xóa khỏi AI</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const OUTLINE_BTN = (border: string, color: string): React.CSSProperties => ({
  height: 36, padding:'0 13px', borderRadius:9, border:`1px solid ${border}`, background:'#fff', color, fontWeight:600, fontSize:12.5, fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, cursor:'pointer',
});

export default TrainTab;
