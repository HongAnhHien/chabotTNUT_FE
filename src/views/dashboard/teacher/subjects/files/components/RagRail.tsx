import { type FC } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { ISubjectFile } from '@/infra/api/interfaces/ITeacher';
import { STATUS_CFG } from '../constants';
import { fmtRelative } from '../helpers';
import { Spinner } from './shared';

interface Props {
  files: ISubjectFile[];
  statTotal: number;
  statSent: number;
  statEmbedded: number;
  trainFilesCount: number;
  pendingAI: number;
  ragPct: number;
  sendingAll: boolean;
  onSendAll: () => void;
  onFileClick: (f: ISubjectFile) => void;
}

const RagRail: FC<Props> = ({
  files, statTotal, statSent, statEmbedded, trainFilesCount, pendingAI, ragPct,
  sendingAll, onSendAll, onFileClick,
}) => {
  const recentActivity = [...files]
    .filter(f => f.updated_at)
    .sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
    .slice(0, 5);

  const circumference = 2 * Math.PI * 52;

  return (
    <div className="tdf-rail">
      {/* Progress card */}
      <div className="tdf-rail-card">
        <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:14 }}>Tiến độ RAG</div>

        {/* Donut ring */}
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
          <div style={{ position:'relative', width:96, height:96, flexShrink:0 }}>
            <svg width={96} height={96} viewBox="0 0 120 120">
              <circle cx={60} cy={60} r={52} fill="none" stroke="#eef2f7" strokeWidth={12} />
              <circle cx={60} cy={60} r={52} fill="none" stroke="#2563eb" strokeWidth={12}
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${circumference * (1 - ragPct / 100)}`}
                transform="rotate(-90 60 60)"
                style={{ transition:'stroke-dashoffset .5s ease' }} />
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'#0f172a', lineHeight:1 }}>{ragPct}%</div>
              <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600, marginTop:2 }}>gửi AI</div>
            </div>
          </div>
          <div style={{ flex:1, fontSize:12.5, color:'#64748b', lineHeight:1.55 }}>
            Còn <b style={{ color:'#0f172a' }}>{pendingAI}</b> tài liệu chưa đưa vào trợ lý AI.
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {[
            { label:'Đã tải lên', count: statTotal,       color:'#94a3b8' },
            { label:'Đã parse',   count: trainFilesCount, color:'#2563eb' },
            { label:'Đã gửi AI',  count: statSent,        color:'#4f46e5' },
            { label:'Đã embed',   count: statEmbedded,    color:'#16a34a' },
          ].map(p => (
            <div key={p.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid #f8fafc' }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:p.color, flexShrink:0 }} />
              <span style={{ fontSize:13, color:'#475569', flex:1 }}>{p.label}</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{p.count}</span>
            </div>
          ))}
        </div>

        <button onClick={onSendAll} disabled={sendingAll} className="tdf-primary" style={{ marginTop:14, width:'100%', justifyContent:'center', height:42, fontSize:13 }}>
          {sendingAll
            ? <><Spinner size={14} color="#fff" /> Đang gửi...</>
            : <><Send size={14} /> Gửi tất cả sang AI</>}
        </button>
      </div>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div className="tdf-rail-card">
          <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:13 }}>Hoạt động gần đây</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {recentActivity.map(f => {
              const st   = f.external_status;
              const cfg  = st ? STATUS_CFG[st] : null;
              const dot  = cfg?.color ?? '#94a3b8';
              const label = cfg?.label ?? 'Mới tải lên';
              return (
                <div key={f.id} style={{ display:'flex', gap:11, cursor:'pointer' }} onClick={() => onFileClick(f)}>
                  <span style={{ width:8, height:8, borderRadius:'50%', marginTop:4, flexShrink:0, background:dot }} />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:12.5, color:'#334155', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.original_name ?? '—'}</div>
                    <div style={{ fontSize:11.5, color:'#94a3b8', marginTop:1 }}>{label} · {fmtRelative(f.updated_at)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RagRail;
