import { type FC } from 'react';
import { FolderOpen, Upload } from 'lucide-react';
import type { ISubjectFile, IFileType } from '@/infra/api/interfaces/ITeacher';
import { TYPE_ORDER, TYPE_LABEL } from '../constants';
import { fmtSize, fmtDate } from '../helpers';
import { StatusBadge, ExtBadge, EmptySlot } from './shared';

interface Props {
  files: ISubjectFile[];
  loading: boolean;
  onRowClick: (f: ISubjectFile) => void;
  onUpload: (type?: IFileType) => void;
}

const FileCardView: FC<Props> = ({ files, loading, onRowClick, onUpload }) => {
  if (loading) {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {TYPE_ORDER.map(t => (
          <div key={t} style={{ background:'#fff', border:'1px solid #e7ecf3', borderRadius:16, padding:16 }}>
            <div className="tdf-skeleton" style={{ height:24, width:160, marginBottom:14 }} />
            <div className="tdf-card-grid">
              {[1,2].map(i => <div key={i} className="tdf-skeleton" style={{ height:88 }} />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {TYPE_ORDER.map(type => {
        const group = files.filter(f => f.type === type);
        return (
          <div key={type} style={{ background:'#fff', border:'1px solid #e7ecf3', borderRadius:16, padding:18 }}>
            {/* Folder header */}
            <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:14 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#eff5ff', color:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <FolderOpen size={18} />
              </div>
              <div style={{ fontSize:14.5, fontWeight:700, color:'#0f172a', flex:1 }}>{TYPE_LABEL[type]}</div>
              <span style={{ fontSize:12, fontWeight:600, color:'#94a3b8', background:'#f1f5f9', padding:'2px 10px', borderRadius:999 }}>{group.length} file</span>
              <button onClick={() => onUpload(type)}
                style={{ height:33, padding:'0 13px', borderRadius:9, border:'1px solid #dbeafe', background:'#eff5ff', color:'#2563eb', fontWeight:600, fontSize:12.5, fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                <Upload size={13} /> Thêm
              </button>
            </div>

            {/* File cards */}
            {group.length > 0 ? (
              <div className="tdf-card-grid">
                {group.map(f => {
                  const name = f.original_name ?? '—';
                  return (
                    <div key={f.id} onClick={() => onRowClick(f)}
                      style={{ border:'1px solid #eef2f7', borderRadius:13, padding:14, cursor:'pointer', transition:'all .15s' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor='#bfdbfe'; el.style.boxShadow='0 6px 18px rgba(37,99,235,.08)'; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor='#eef2f7'; el.style.boxShadow='none'; }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:11, marginBottom:9 }}>
                        <ExtBadge name={name} size={38} />
                        <div style={{ minWidth:0, flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
                          <div style={{ fontSize:11.5, color:'#94a3b8', marginTop:2 }}>{fmtSize(f.file_size)} · {fmtDate(f.created_at)}</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        <StatusBadge status={f.external_status ?? null} />
                        {f.is_private && <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:999, background:'#f1f5f9', color:'#64748b' }}>Ẩn</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptySlot text="Chưa có file — click để upload" onUpload={() => onUpload(type)} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FileCardView;
