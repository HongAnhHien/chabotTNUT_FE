import { type FC, useEffect, useRef, useState } from 'react';
import { FolderOpen, Search, X, Download, Send, Pencil, Trash2, Loader2, MoreHorizontal } from 'lucide-react';
import type { ISubjectFile, IFileType } from '@/infra/api/interfaces/ITeacher';
import { TYPE_ORDER, TYPE_LABEL, STATUS_FILTER_LABELS } from '../constants';
import { fmtSize, fmtDate, isAiOk } from '../helpers';
import type { StatusF } from '../types';
import { StatusBadge, ExtBadge } from './shared';

interface Props {
  files: ISubjectFile[];
  filteredFiles: ISubjectFile[];
  loading: boolean;
  search: string;
  statusFilter: StatusF;
  activeFolder: 'all' | IFileType;
  deleting: Record<string, boolean>;
  sending: Record<string, boolean>;
  onSearch: (v: string) => void;
  onStatusFilter: (v: StatusF) => void;
  onFolder: (v: 'all' | IFileType) => void;
  onRowClick: (f: ISubjectFile) => void;
  onEditMeta: (f: ISubjectFile) => void;
  onSend: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (url: string, name: string) => void;
}

// ── Per-row action dropdown ───────────────────────────────────
interface RowActionsProps {
  f: ISubjectFile;
  sending: boolean;
  deleting: boolean;
  onEditMeta: () => void;
  onSend: () => void;
  onDelete: () => void;
  onDownload: () => void;
}

const RowActions: FC<RowActionsProps> = ({ f, sending, deleting, onEditMeta, onSend, onDelete, onDownload }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const name = f.original_name ?? '—';

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:5 }}>
      {/* Gửi AI — stays outside */}
      {isAiOk(name) && !f.external_status && (
        <button
          className="tdf-act"
          onClick={onSend}
          disabled={sending}
          title="Gửi sang AI"
          style={{ color:'#4f46e5', borderColor:'#c7d2fe' }}
        >
          {sending
            ? <Loader2 size={13} style={{ animation:'tdf-spin 1s linear infinite' }} />
            : <Send size={13} />}
        </button>
      )}

      {/* Dropdown trigger */}
      <div ref={ref} style={{ position:'relative' }}>
        <button
          className="tdf-act"
          onClick={() => setOpen(o => !o)}
          title="Thêm hành động"
          style={open ? { background:'#eff5ff', color:'#2563eb', borderColor:'#bfdbfe' } : undefined}
        >
          <MoreHorizontal size={13} />
        </button>

        {open && (
          <div style={{
            position:'absolute', right:0, top:'calc(100% + 6px)',
            background:'#fff', border:'1px solid #e7ecf3', borderRadius:12,
            boxShadow:'0 8px 28px rgba(15,23,42,.14)', padding:5,
            minWidth:152, zIndex:30,
          }}>
            <DropItem
              icon={<Pencil size={13} />}
              label="Chỉnh sửa"
              onClick={() => { onEditMeta(); setOpen(false); }}
            />
            {f.download_url && (
              <DropItem
                icon={<Download size={13} />}
                label="Tải xuống"
                onClick={() => { onDownload(); setOpen(false); }}
              />
            )}
            <div style={{ height:1, background:'#f1f5f9', margin:'4px 0' }} />
            <DropItem
              icon={deleting
                ? <Loader2 size={13} style={{ animation:'tdf-spin 1s linear infinite' }} />
                : <Trash2 size={13} />}
              label="Xóa tài liệu"
              danger
              onClick={() => { if (!deleting) { onDelete(); setOpen(false); } }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const DropItem: FC<{ icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }> = ({ icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    style={{
      width:'100%', display:'flex', alignItems:'center', gap:9,
      padding:'8px 11px', borderRadius:8, border:'none',
      background:'transparent', fontFamily:'inherit', fontSize:13,
      color: danger ? '#dc2626' : '#334155', fontWeight:600,
      cursor:'pointer', textAlign:'left', transition:'background .1s',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = danger ? '#fef2f2' : '#f8fafc'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
  >
    {icon} {label}
  </button>
);

// ── Skeleton ──────────────────────────────────────────────────
const Skeleton = () => (
  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
    {[1,2,3,4,5].map(i => (
      <div key={i} className="tdf-skeleton" style={{ height:64, animationDelay:`${i*.06}s` }} />
    ))}
  </div>
);

// ── Main component ────────────────────────────────────────────
const FileListView: FC<Props> = ({
  files, filteredFiles, loading,
  search, statusFilter, activeFolder,
  deleting, sending,
  onSearch, onStatusFilter, onFolder,
  onRowClick, onEditMeta, onSend, onDelete, onDownload,
}) => {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Search + filters */}
      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <div style={{ flex:'1 1 220px', position:'relative' }}>
          <Search size={15} color="#94a3b8" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Tìm tài liệu theo tên..."
            style={{ width:'100%', height:42, border:'1px solid #e7ecf3', background:'#fff', borderRadius:12, padding:'0 14px 0 38px', fontFamily:'inherit', fontSize:13.5, color:'#334155', outline:'none', boxSizing:'border-box' }}
            onFocus={e => (e.target.style.borderColor = '#93c5fd')}
            onBlur={e  => (e.target.style.borderColor = '#e7ecf3')}
          />
          {search && (
            <button onClick={() => onSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0, display:'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {(Object.keys(STATUS_FILTER_LABELS) as StatusF[]).map(id => (
            <button key={id} className={`tdf-chip ${statusFilter === id ? 'on' : 'off'}`} onClick={() => onStatusFilter(id)}>
              {STATUS_FILTER_LABELS[id]}
            </button>
          ))}
        </div>
      </div>

      {/* Layout A: folder nav + table */}
      <div className="tdf-list-outer">
        {/* Folder nav */}
        <div className="tdf-folder-col" style={{ background:'#fff', border:'1px solid #e7ecf3', borderRadius:16, padding:10, position:'sticky', top:24 }}>
          <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:.6, color:'#94a3b8', padding:'6px 10px 8px', textTransform:'uppercase' }}>Thư mục</div>
          {[
            { id: 'all' as const, name:'Tất cả', count: files.length },
            ...TYPE_ORDER.map(t => ({ id: t, name: TYPE_LABEL[t], count: files.filter(f => f.type === t).length })),
          ].map(fo => {
            const on = activeFolder === fo.id;
            return (
              <div key={fo.id} className={`tdf-folder-item ${on ? 'on' : 'off'}`} onClick={() => onFolder(fo.id)}>
                <FolderOpen size={16} />
                <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:13 }}>{fo.name}</span>
                <span style={{ fontSize:11.5, fontWeight:700, padding:'1px 7px', borderRadius:999, background: on ? '#dbeafe' : '#f1f5f9', color: on ? '#1d4ed8' : '#94a3b8' }}>{fo.count}</span>
              </div>
            );
          })}
        </div>

        {/* File table */}
        <div style={{ background:'#fff', border:'1px solid #e7ecf3', borderRadius:16, overflow:'hidden' }}>
          {/* Column headers */}
          <div style={{ display:'flex', alignItems:'center', padding:'11px 18px', borderBottom:'1px solid #f1f5f9', fontSize:10.5, fontWeight:700, letterSpacing:.5, color:'#94a3b8', textTransform:'uppercase' }}>
            <span style={{ flex:'1 1 0', minWidth:0 }}>Tên tài liệu</span>
            <span className="tdf-col-type" style={{ width:160, flexShrink:0 }}>Loại tài liệu</span>
            <span className="tdf-col-st"   style={{ width:130, flexShrink:0 }}>Trạng thái</span>
            <span className="tdf-col-act"  style={{ width:96,  flexShrink:0, textAlign:'right' }}>Hành động</span>
          </div>

          {loading ? (
            <div style={{ padding:18 }}><Skeleton /></div>
          ) : filteredFiles.length === 0 ? (
            <div style={{ padding:'40px 0', textAlign:'center', color:'#94a3b8', fontSize:13.5 }}>
              {search || statusFilter !== 'all' ? 'Không tìm thấy tài liệu phù hợp.' : 'Thư mục này chưa có tài liệu.'}
            </div>
          ) : filteredFiles.map(f => {
            const name = f.original_name ?? '—';
            return (
              <div key={f.id} className="tdf-file-row" onClick={() => onRowClick(f)}>
                <ExtBadge name={name} size={40} />

                {/* Tên tài liệu — truncates with ellipsis */}
                <div style={{ flex:'1 1 0', minWidth:0, overflow:'hidden' }}>
                  <div style={{
                    fontSize:13.5, fontWeight:600, color:'#0f172a',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    wordBreak:'break-all',
                  }}>
                    {name}
                  </div>
                  <div style={{ fontSize:11.5, color:'#94a3b8', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {fmtSize(f.file_size)} · {f.uploaded_by ?? ''}{f.created_at ? ` · ${fmtDate(f.created_at)}` : ''}
                    {f.is_private && <span style={{ marginLeft:6, color:'#d97706', fontWeight:700 }}>· Ẩn</span>}
                  </div>
                </div>

                {/* Loại tài liệu */}
                <div className="tdf-col-type" style={{ width:160, flexShrink:0, paddingRight:8 }}>
                  <span style={{
                    fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:999,
                    background:'#f1f5f9', color:'#475569',
                    display:'inline-block', maxWidth:'100%',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  }}>
                    {TYPE_LABEL[f.type] ?? f.type}
                  </span>
                </div>

                {/* Trạng thái */}
                <div className="tdf-col-st" style={{ width:130, flexShrink:0, display:'flex', alignItems:'center' }}>
                  <StatusBadge status={f.external_status ?? null} />
                </div>

                {/* Hành động */}
                <div className="tdf-col-act" style={{ width:96, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                  <RowActions
                    f={f}
                    sending={!!sending[f.id]}
                    deleting={!!deleting[f.id]}
                    onEditMeta={() => onEditMeta(f)}
                    onSend={() => onSend(f.id)}
                    onDelete={() => onDelete(f.id)}
                    onDownload={() => onDownload(f.download_url, name)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FileListView;
