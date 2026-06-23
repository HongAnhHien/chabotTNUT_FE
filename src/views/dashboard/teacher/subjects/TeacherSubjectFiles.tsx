import {
  type FC, type ChangeEvent,
  useCallback, useEffect, useRef, useState,
} from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  ArrowLeft, Upload, RefreshCw, Download, Trash2,
  Eye, Send, Clock, CheckCircle, XCircle, Loader2,
  FileText, AlertCircle, X, Bot,
  Image, Film, Archive, FileSpreadsheet, Sparkles,
  ExternalLink, FolderOpen, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type {
  ISubjectFile, IFileType, IFileExternalStatus,
} from '@/infra/api/interfaces/ITeacher';

// ── CSS ──────────────────────────────────────────────────
const CSS = `
  @keyframes sf-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes sf-spin{to{transform:rotate(360deg)}}
  @keyframes sf-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes sf-drop-pulse{0%,100%{border-color:rgba(37,99,235,0.3)}50%{border-color:#2563eb}}
  .sf-btn{display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border-radius:7px;font-size:0.68rem;font-weight:700;cursor:pointer;border:none;transition:opacity .14s,transform .1s;white-space:nowrap}
  .sf-btn:hover{opacity:.85;transform:scale(1.02)}
  .sf-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
  .sf-tab{padding:8px 18px;border-radius:10px;font-size:0.8rem;font-weight:700;cursor:pointer;border:none;transition:all .15s}
  .sf-tab.active{background:linear-gradient(135deg,#1e3a8a,#2563eb);color:white}
  .sf-tab.inactive{background:rgba(37,99,235,0.06);color:#64748b}
  .sf-tab.inactive:hover{background:rgba(37,99,235,0.1);color:#2563eb}
  .sf-drop-zone{border:2px dashed rgba(37,99,235,0.25);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 20px;cursor:pointer;transition:border-color .15s,background .15s}
  .sf-drop-zone.drag-over{border-color:#2563eb;background:rgba(37,99,235,0.04);animation:sf-drop-pulse 1s ease infinite}
  .sf-drop-zone:hover{border-color:rgba(37,99,235,0.5);background:rgba(37,99,235,0.02)}
  .sf-modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}
  .sf-modal{background:white;border-radius:18px;width:100%;max-width:600px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 24px 60px rgba(0,0,0,0.18);animation:sf-fade .25s ease}
  .sf-md-modal{max-width:760px}
  .sf-skeleton{border-radius:10px;background:linear-gradient(90deg,#f0f4ff 25%,#e8f0fe 50%,#f0f4ff 75%);background-size:200% 100%;animation:sf-shimmer 1.4s ease infinite}
  .sf-file-row{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(37,99,235,0.05);transition:background .13s}
  .sf-file-row:last-child{border-bottom:none}
  .sf-file-row:hover{background:rgba(37,99,235,0.02)}
  .sf-type-select{padding:3px 6px;border-radius:6px;border:1.5px solid rgba(37,99,235,0.18);font-size:0.65rem;font-weight:600;color:#1e3a8a;background:rgba(37,99,235,0.04);outline:none;cursor:pointer;max-width:130px}
  .sf-type-select:focus{border-color:#2563eb}
`;

// ── Constants ─────────────────────────────────────────────
type Tab = 'files' | 'sent';
const TYPE_ORDER: IFileType[] = ['de_cuong', 'ly_thuyet', 'ma_tran_cau_hoi', 'ngan_hang_cau_hoi', 'khac'];
const POLLING_STATUSES: IFileExternalStatus[] = ['pending', 'send_queued', 'sending'];

const FILE_TYPES: { value: IFileType; label: string }[] = [
  { value: 'de_cuong',          label: 'Đề cương môn học'     },
  { value: 'ly_thuyet',         label: 'Tài liệu lý thuyết'  },
  { value: 'ma_tran_cau_hoi',   label: 'Ma trận câu hỏi'     },
  { value: 'ngan_hang_cau_hoi', label: 'Ngân hàng câu hỏi'   },
  { value: 'khac',              label: 'Khác'                 },
];

const TYPE_LABEL: Record<IFileType, string> = {
  de_cuong:          'Đề cương môn học',
  ly_thuyet:         'Tài liệu lý thuyết',
  ma_tran_cau_hoi:   'Ma trận câu hỏi đề thi',
  ngan_hang_cau_hoi: 'Ngân hàng câu hỏi',
  khac:              'Khác',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: FC<{size?:number}> }> = {
  pending:    { label: 'Đang parse...', color: '#d97706', bg: 'rgba(217,119,6,0.09)',    icon: ({ size }) => <Loader2 size={size ?? 10} style={{ animation:'sf-spin 1s linear infinite' }} /> },
  parsed:     { label: 'Cần review',   color: '#7c3aed', bg: 'rgba(124,58,237,0.09)',   icon: ({ size }) => <Eye size={size ?? 10} /> },
  send_queued:{ label: 'Chờ gửi',      color: '#0891b2', bg: 'rgba(8,145,178,0.09)',    icon: ({ size }) => <Clock size={size ?? 10} /> },
  sending:    { label: 'Đang gửi...',  color: '#2563eb', bg: 'rgba(37,99,235,0.09)',    icon: ({ size }) => <Loader2 size={size ?? 10} style={{ animation:'sf-spin 1s linear infinite' }} /> },
  success:    { label: 'Đã gửi AI',    color: '#059669', bg: 'rgba(5,150,105,0.09)',    icon: ({ size }) => <CheckCircle size={size ?? 10} /> },
  failed:     { label: 'Thất bại',     color: '#dc2626', bg: 'rgba(220,38,38,0.09)',    icon: ({ size }) => <XCircle size={size ?? 10} /> },
};

// ── Helpers ───────────────────────────────────────────────
const fmtSize = (b?: number | null) => {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

const fmtDate = (s?: string | null) => {
  if (!s) return '';
  const d = new Date(s);
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
};

const extOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

const FileIcon: FC<{ name: string; size?: number; color?: string }> = ({ name, size = 15, color }) => {
  const ext = extOf(name);
  if (/^(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(ext)) return <Image size={size} color={color ?? '#0891b2'} />;
  if (/^(mp4|mkv|avi|mov|webm|flv)$/.test(ext))          return <Film size={size} color={color ?? '#7c3aed'} />;
  if (/^(zip|rar|7z|tar|gz)$/.test(ext))                  return <Archive size={size} color={color ?? '#d97706'} />;
  if (/^(xls|xlsx|csv)$/.test(ext))                       return <FileSpreadsheet size={size} color={color ?? '#059669'} />;
  return <FileText size={size} color={color ?? '#2563eb'} />;
};

const iconBgOf = (name: string) => {
  const ext = extOf(name);
  if (/^(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(ext)) return 'rgba(8,145,178,0.08)';
  if (/^(mp4|mkv|avi|mov|webm|flv)$/.test(ext))          return 'rgba(124,58,237,0.08)';
  if (/^(zip|rar|7z|tar|gz)$/.test(ext))                  return 'rgba(217,119,6,0.08)';
  if (/^(xls|xlsx|csv)$/.test(ext))                       return 'rgba(5,150,105,0.08)';
  return 'rgba(37,99,235,0.07)';
};

const isAiCompatible = (name: string) => /\.(pdf|doc|docx)$/i.test(name);

const groupByType = (files: ISubjectFile[]): Record<IFileType, ISubjectFile[]> => {
  const g = {} as Record<IFileType, ISubjectFile[]>;
  TYPE_ORDER.forEach(t => { g[t] = []; });
  files.forEach(f => {
    const t = (f.type as IFileType) ?? 'khac';
    if (!g[t]) g[t] = [];
    g[t].push(f);
  });
  return g;
};

const StatusBadge: FC<{ status: IFileExternalStatus }> = ({ status }) => {
  if (!status) return null;
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, background:cfg.bg, color:cfg.color, fontSize:'0.62rem', fontWeight:800 }}>
      <Icon size={9} /> {cfg.label}
    </span>
  );
};

// ── Upload Docs Modal ─────────────────────────────────────
interface FileItem { file: File; type: IFileType; isPrivate: boolean }

// Inline switch component
const Toggle: FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <div onClick={() => onChange(!checked)} style={{ width:30, height:17, borderRadius:9, cursor:'pointer', transition:'background .2s', background: checked ? '#2563eb' : '#cbd5e1', position:'relative', flexShrink:0 }}>
    <div style={{ position:'absolute', top:2.5, left: checked ? 15 : 2.5, width:12, height:12, borderRadius:'50%', background:'white', transition:'left .18s', boxShadow:'0 1px 3px rgba(0,0,0,0.22)' }} />
  </div>
);

const UploadDocsModal: FC<{
  maMon: string;
  defaultType?: IFileType;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ maMon, defaultType, onClose, onSuccess }) => {
  const [items,    setItems]    = useState<FileItem[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [drag,     setDrag]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setItems(prev => {
      const existing = new Set(prev.map(i => i.file.name + i.file.size));
      return [
        ...prev,
        ...Array.from(list)
          .filter(f => !existing.has(f.name + f.size))
          .map(f => ({ file: f, type: defaultType ?? 'ly_thuyet', isPrivate: false })),
      ];
    });
  };

  const updateType    = (idx: number, type: IFileType) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, type } : it));
  const updatePrivate = (idx: number, val: boolean) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, isPrivate: val } : it));
  const removeItem    = (idx: number) =>
    setItems(prev => prev.filter((_, i) => i !== idx));
  const setAllPrivate = (val: boolean) =>
    setItems(prev => prev.map(it => ({ ...it, isPrivate: val })));

  const handleSubmit = async () => {
    if (!items.length) return;
    setLoading(true);
    let done = 0;
    const failed: string[] = [];
    for (const it of items) {
      try {
        await TeacherApi.uploadSubjectFile(maMon, it.file, it.type, it.isPrivate);
        done++;
        setProgress({ done, total: items.length });
      } catch (e: unknown) {
        const resp = (e as { response?: { status?: number; data?: { message?: string; uploaded_by?: string } } })?.response;
        if (resp?.status === 409 && resp.data?.uploaded_by) {
          toast.error(`"${it.file.name}": File loại này đã được ${resp.data.uploaded_by} upload. Liên hệ họ để xóa trước khi upload mới.`, { duration: 6000 });
        } else {
          failed.push(it.file.name);
        }
      }
    }
    setLoading(false);
    setProgress(null);
    if (failed.length) toast.error(`Upload thất bại ${failed.length} file: ${failed.slice(0,2).join(', ')}${failed.length > 2 ? '...' : ''}`);
    if (done > 0) { toast.success(`Upload xong ${done}/${items.length} file`); onSuccess(); onClose(); }
  };

  const hiddenCount = items.filter(it => it.isPrivate).length;

  return (
    <div className="sf-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sf-modal">
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 20px', borderBottom:'1px solid rgba(37,99,235,0.08)', flexShrink:0 }}>
          <Upload size={15} color="#2563eb" />
          <div style={{ flex:1, fontWeight:800, fontSize:'0.92rem', color:'#1e293b' }}>Upload tài liệu</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><X size={16} /></button>
        </div>

        <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:14, overflowY:'auto', flex:1 }}>
          {/* Drop zone */}
          <div
            className={`sf-drop-zone${drag ? ' drag-over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          >
            <input ref={inputRef} type="file" multiple style={{ display:'none' }}
              onChange={(e: ChangeEvent<HTMLInputElement>) => addFiles(e.target.files)} />
            <Upload size={24} color="#94a3b8" />
            <div style={{ marginTop:6, fontWeight:700, color:'#64748b', fontSize:'0.83rem' }}>Kéo thả hoặc click để chọn file</div>
            <div style={{ fontSize:'0.67rem', color:'#94a3b8', marginTop:3 }}>Hỗ trợ tất cả loại file · Chọn nhiều file cùng lúc</div>
          </div>

          {items.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {/* Bulk private actions */}
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:'0.68rem', fontWeight:700, color:'#64748b', flex:1 }}>
                  Ẩn khỏi học sinh
                  {hiddenCount > 0 && <span style={{ marginLeft:5, background:'rgba(217,119,6,0.1)', color:'#d97706', borderRadius:20, padding:'1px 7px', fontSize:'0.6rem', fontWeight:800 }}>{hiddenCount}/{items.length} ẩn</span>}
                </span>
                <button onClick={() => setAllPrivate(false)} className="sf-btn" style={{ background:'rgba(37,99,235,0.07)', color:'#2563eb', fontSize:'0.62rem' }}>Hiện tất cả</button>
                <button onClick={() => setAllPrivate(true)}  className="sf-btn" style={{ background:'rgba(217,119,6,0.08)', color:'#d97706', fontSize:'0.62rem' }}>Ẩn tất cả</button>
              </div>

              {/* Column headers */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 130px 44px 22px', gap:6, padding:'0 8px 4px', fontSize:'0.59rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                <span>File</span><span>Loại</span><span style={{ textAlign:'center' }}>Ẩn</span><span />
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:280, overflowY:'auto' }}>
                {items.map((it, idx) => (
                  <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr 130px 44px 22px', gap:6, alignItems:'center', padding:'7px 8px', background: it.isPrivate ? 'rgba(217,119,6,0.04)' : 'rgba(37,99,235,0.03)', borderRadius:9, border:`1px solid ${it.isPrivate ? 'rgba(217,119,6,0.12)' : 'rgba(37,99,235,0.06)'}`, transition:'background .15s,border-color .15s' }}>
                    {/* File info */}
                    <div style={{ display:'flex', alignItems:'center', gap:7, minWidth:0 }}>
                      <div style={{ flexShrink:0, width:28, height:28, borderRadius:7, background:iconBgOf(it.file.name), display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <FileIcon name={it.file.name} size={13} />
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:'0.73rem', fontWeight:600, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{it.file.name}</div>
                        <div style={{ fontSize:'0.6rem', color:'#94a3b8', display:'flex', gap:4, alignItems:'center' }}>
                          {fmtSize(it.file.size)}
                          {it.isPrivate && <span style={{ color:'#d97706', fontWeight:700 }}>· Ẩn</span>}
                        </div>
                      </div>
                    </div>
                    {/* Type */}
                    <select value={it.type} onChange={e => updateType(idx, e.target.value as IFileType)} className="sf-type-select">
                      {FILE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    {/* Private switch */}
                    <div style={{ display:'flex', justifyContent:'center' }}>
                      <Toggle checked={it.isPrivate} onChange={v => updatePrivate(idx, v)} />
                    </div>
                    {/* Remove */}
                    <button onClick={() => removeItem(idx)}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress bar */}
          {progress && (
            <div>
              <div style={{ fontSize:'0.72rem', color:'#64748b', marginBottom:4 }}>Đang upload {progress.done}/{progress.total}...</div>
              <div style={{ height:4, background:'rgba(37,99,235,0.1)', borderRadius:4 }}>
                <div style={{ height:'100%', background:'linear-gradient(90deg,#1e3a8a,#2563eb)', borderRadius:4, width:`${(progress.done/progress.total)*100}%`, transition:'width .3s' }} />
              </div>
            </div>
          )}
        </div>

        <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(37,99,235,0.08)', display:'flex', gap:8, justifyContent:'flex-end', alignItems:'center', flexShrink:0 }}>
          {items.length > 0 && <span style={{ flex:1, fontSize:'0.72rem', color:'#64748b', fontWeight:600 }}>{items.length} file đã chọn</span>}
          <button onClick={onClose} className="sf-btn" style={{ background:'rgba(37,99,235,0.07)', color:'#2563eb' }}>Hủy</button>
          <button onClick={handleSubmit} disabled={!items.length || loading} className="sf-btn"
            style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', color:'white', padding:'6px 16px' }}>
            {loading
              ? <><Loader2 size={11} style={{ animation:'sf-spin 1s linear infinite' }} /> Đang upload...</>
              : <><Upload size={11} /> Upload {items.length > 0 ? `(${items.length})` : ''}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Markdown Review Modal ─────────────────────────────────
// Chỉnh sửa markdown real-time → gửi sang chatbot
const MarkdownModal: FC<{
  maMon: string;
  file: ISubjectFile;
  onClose: () => void;
  onSubmit: (fileId: string, markdown: string) => void;
}> = ({ maMon, file, onClose, onSubmit }) => {
  const [markdown, setMarkdown] = useState('');
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    TeacherApi.getFileMarkdown(maMon, file.id)
      .then(r => setMarkdown(r.data.markdown))
      .catch(() => toast.error('Không thể tải markdown.'))
      .finally(() => setLoading(false));
  }, [maMon, file.id]);

  const handleSend = () => {
    if (!markdown || saving) return;
    setSaving(true);
    onSubmit(file.id, markdown);
  };

  return (
    <div className="sf-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sf-modal sf-md-modal">
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 18px', borderBottom:'1px solid rgba(124,58,237,0.1)', flexShrink:0 }}>
          <Sparkles size={14} color="#7c3aed" />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:'0.9rem', color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file.original_name}</div>
            <div style={{ fontSize:'0.65rem', color:'#94a3b8', marginTop:1 }}>Chỉnh sửa markdown · gửi sang chatbot ngay sau khi xong</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', flexShrink:0 }}><X size={16} /></button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'12px 18px' }}>
          {loading
            ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200 }}>
                <Loader2 size={24} color="#7c3aed" style={{ animation:'sf-spin 1s linear infinite' }} />
              </div>
            : <textarea value={markdown} onChange={e => setMarkdown(e.target.value)}
                style={{ width:'100%', minHeight:340, padding:'10px 12px', borderRadius:10, border:'1.5px solid rgba(124,58,237,0.18)', fontSize:'0.78rem', fontFamily:'monospace', lineHeight:1.6, color:'#1e293b', resize:'vertical', outline:'none', background:'#fdfaff', boxSizing:'border-box' }} />
          }
        </div>

        <div style={{ padding:'12px 18px', borderTop:'1px solid rgba(124,58,237,0.1)', display:'flex', gap:8, justifyContent:'flex-end', alignItems:'center', flexShrink:0 }}>
          <button onClick={onClose} className="sf-btn" style={{ background:'rgba(100,116,139,0.08)', color:'#64748b' }}>Đóng</button>
          <button onClick={handleSend} disabled={loading || !markdown || saving} className="sf-btn"
            style={{ background:'linear-gradient(135deg,#4c1d95,#7c3aed)', color:'white', padding:'6px 16px' }}>
            {saving
              ? <><Loader2 size={10} style={{ animation:'sf-spin 1s linear infinite' }} /> Đang gửi...</>
              : <><Send size={10} /> Gửi sang chatbot</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── File row card ─────────────────────────────────────────
const FileRow: FC<{
  file: ISubjectFile;
  onDelete: (id: string) => void;
  onSendToAI: (id: string) => void;
  deleting: boolean;
  sendingAI: boolean;
}> = ({ file, onDelete, onSendToAI, deleting, sendingAI }) => {
  const name = file.original_name ?? '';
  const canDelete  = !file.external_status;
  const canSendAI  = isAiCompatible(name) && !file.external_status;

  return (
    <div className="sf-file-row">
      <div style={{ flexShrink:0, width:36, height:36, borderRadius:10, background:iconBgOf(name), display:'flex', alignItems:'center', justifyContent:'center' }}>
        <FileIcon name={name} />
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:'0.8rem', color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
        <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:2, flexWrap:'wrap' }}>
          <span style={{ fontSize:'0.62rem', color:'#94a3b8' }}>{fmtSize(file.file_size)}</span>
          {file.uploaded_by && <span style={{ fontSize:'0.62rem', color:'#64748b' }}>· {file.uploaded_by}</span>}
          {file.created_at  && <span style={{ fontSize:'0.62rem', color:'#94a3b8' }}>· {fmtDate(file.created_at)}</span>}
          {file.is_private  && <span style={{ fontSize:'0.6rem', fontWeight:700, color:'#d97706', background:'rgba(217,119,6,0.08)', borderRadius:20, padding:'1px 6px' }}>Ẩn</span>}
          {file.external_status && <StatusBadge status={file.external_status} />}
        </div>
      </div>

      <div style={{ display:'flex', gap:5, flexShrink:0 }}>
        {file.download_url && (
          <a href={file.download_url} target="_blank" rel="noreferrer" className="sf-btn"
            style={{ background:'rgba(37,99,235,0.07)', color:'#2563eb', textDecoration:'none' }}>
            <ExternalLink size={10} /> Xem
          </a>
        )}
        {file.download_url && (
          <a href={file.download_url} download className="sf-btn"
            style={{ background:'rgba(37,99,235,0.05)', color:'#64748b', textDecoration:'none' }}>
            <Download size={10} />
          </a>
        )}
        {canSendAI && (
          <button onClick={() => onSendToAI(file.id)} disabled={sendingAI} className="sf-btn"
            style={{ background:'rgba(124,58,237,0.09)', color:'#7c3aed' }}>
            {sendingAI
              ? <><Loader2 size={10} style={{ animation:'sf-spin 1s linear infinite' }} /> Đang gửi...</>
              : <><Sparkles size={10} /> Gửi AI</>}
          </button>
        )}
        {canDelete && (
          <button onClick={() => onDelete(file.id)} disabled={deleting} className="sf-btn"
            style={{ background:'rgba(220,38,38,0.07)', color:'#dc2626' }}>
            {deleting ? <Loader2 size={10} style={{ animation:'sf-spin 1s linear infinite' }} /> : <Trash2 size={10} />}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Files Tab ─────────────────────────────────────────────
const FilesTab: FC<{
  files: ISubjectFile[];
  loading: boolean;
  onUpload: (type: IFileType) => void;
  onDelete: (id: string) => void;
  onSendToAI: (id: string) => void;
  deleting: Record<string, boolean>;
  sendingAI: Record<string, boolean>;
}> = ({ files, loading, onUpload, onDelete, onSendToAI, deleting, sendingAI }) => {
  const [collapsed, setCollapsed] = useState<Partial<Record<IFileType, boolean>>>({});

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {[1,2,3,4,5].map(i => <div key={i} className="sf-skeleton" style={{ height:64, animationDelay:`${i*0.07}s` }} />)}
    </div>
  );

  const groups = groupByType(files);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {TYPE_ORDER.map(type => {
        const group = groups[type] ?? [];
        const isCollapsed = !!collapsed[type];

        return (
          <div key={type} style={{ background:'white', borderRadius:14, border:'1px solid rgba(37,99,235,0.08)', overflow:'hidden', boxShadow:'0 1px 6px rgba(30,58,138,0.04)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', background:'rgba(37,99,235,0.03)', borderBottom: isCollapsed ? 'none' : '1px solid rgba(37,99,235,0.06)' }}>
              <FolderOpen size={13} color="#2563eb" />
              <span style={{ flex:1, fontWeight:800, fontSize:'0.76rem', color:'#1e3a8a' }}>{TYPE_LABEL[type]}</span>
              {group.length > 0 && (
                <span style={{ fontSize:'0.62rem', fontWeight:700, color:'#94a3b8', background:'rgba(37,99,235,0.07)', borderRadius:20, padding:'2px 8px' }}>
                  {group.length} file
                </span>
              )}
              <button onClick={() => onUpload(type)} className="sf-btn"
                style={{ background:'rgba(37,99,235,0.08)', color:'#2563eb', padding:'3px 9px' }}>
                <Upload size={9} /> Upload
              </button>
              {group.length > 0 && (
                <button onClick={() => setCollapsed(p => ({ ...p, [type]: !isCollapsed }))}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:'2px', display:'flex', alignItems:'center' }}>
                  {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
              )}
            </div>

            {!isCollapsed && (
              group.length > 0
                ? group.map(f => (
                    <FileRow key={f.id} file={f}
                      onDelete={onDelete} onSendToAI={onSendToAI}
                      deleting={!!deleting[f.id]} sendingAI={!!sendingAI[f.id]} />
                  ))
                : <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', cursor:'pointer' }} onClick={() => onUpload(type)}>
                    <div style={{ width:30, height:30, borderRadius:8, background:'rgba(37,99,235,0.05)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Upload size={13} color="#94a3b8" />
                    </div>
                    <span style={{ fontSize:'0.75rem', color:'#94a3b8' }}>Chưa có file — click để upload</span>
                  </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Sent Tab (Train AI) ───────────────────────────────────
const SentTab: FC<{
  maMon: string;
  files: ISubjectFile[];
  loading: boolean;
  onRefresh: () => void;
  onReview:  (f: ISubjectFile) => void;
  onCancel:  (fileId: string) => void;
  onRetry:   (fileId: string) => void;
  onDelLink: (fileId: string) => void;
  onGoToFiles: () => void;
  working: Record<string, boolean>;
}> = ({ files, loading, onRefresh, onReview, onCancel, onRetry, onDelLink, onGoToFiles, working }) => {

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {[1,2,3].map(i => <div key={i} className="sf-skeleton" style={{ height:52, animationDelay:`${i*0.08}s` }} />)}
    </div>
  );

  if (!files.length) return (
    <div style={{ textAlign:'center', padding:'3rem 1rem' }}>
      <Bot size={40} color="#c4b5fd" style={{ margin:'0 auto 10px', display:'block' }} />
      <div style={{ fontSize:'0.88rem', fontWeight:700, color:'#1e293b' }}>Chưa có file nào gửi AI</div>
      <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:4 }}>
        Sang tab <span style={{ fontWeight:700, color:'#2563eb', cursor:'pointer' }} onClick={onGoToFiles}>Tài liệu</span> → chọn file PDF/Word → bấm <strong style={{ color:'#7c3aed' }}>Gửi AI</strong>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
        <button onClick={onRefresh} className="sf-btn" style={{ background:'rgba(124,58,237,0.07)', color:'#7c3aed' }}>
          <RefreshCw size={11} /> Làm mới
        </button>
      </div>
      <div style={{ background:'white', borderRadius:14, border:'1px solid rgba(124,58,237,0.08)', overflow:'hidden' }}>
        {files.map(f => {
          const st = f.external_status;
          const extResp = f.external_response;
          const errMsg = typeof extResp === 'object' && extResp !== null
            ? (extResp as { error?: string }).error ?? null
            : typeof extResp === 'string' ? extResp : null;

          return (
            <div key={f.id} className="sf-file-row">
              <div style={{ flexShrink:0, width:36, height:36, borderRadius:10, background:'rgba(124,58,237,0.07)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <FileText size={15} color="#7c3aed" />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:'0.8rem', color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.original_name}</div>
                <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:2, flexWrap:'wrap' }}>
                  <StatusBadge status={st ?? null} />
                  <span style={{ fontSize:'0.62rem', color:'#94a3b8' }}>{f.type_label}</span>
                </div>
                {errMsg && (
                  <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:3, fontSize:'0.62rem', color:'#dc2626' }}>
                    <AlertCircle size={9} /> {errMsg}
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                {st === 'parsed' && (
                  <button onClick={() => onReview(f)} className="sf-btn" style={{ background:'rgba(124,58,237,0.09)', color:'#7c3aed' }}>
                    <Eye size={10} /> Xem & gửi
                  </button>
                )}
                {st === 'send_queued' && (
                  <button onClick={() => onCancel(f.id)} disabled={!!working[f.id]} className="sf-btn"
                    style={{ background:'rgba(220,38,38,0.07)', color:'#dc2626' }}>
                    {working[f.id] ? <Loader2 size={10} style={{ animation:'sf-spin 1s linear infinite' }} /> : <X size={10} />} Hủy
                  </button>
                )}
                {st === 'failed' && (
                  <button onClick={() => onRetry(f.id)} disabled={!!working[f.id]} className="sf-btn"
                    style={{ background:'rgba(217,119,6,0.08)', color:'#d97706' }}>
                    {working[f.id] ? <Loader2 size={10} style={{ animation:'sf-spin 1s linear infinite' }} /> : <RefreshCw size={10} />} Thử lại
                  </button>
                )}
                {st === 'success' && (
                  <button onClick={() => onDelLink(f.id)} disabled={!!working[f.id]} className="sf-btn"
                    style={{ background:'rgba(100,116,139,0.08)', color:'#64748b' }}>
                    {working[f.id] ? <Loader2 size={10} style={{ animation:'sf-spin 1s linear infinite' }} /> : <Trash2 size={10} />} Xóa khỏi AI
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────
const TeacherSubjectFiles: FC = () => {
  const { maMon }       = useParams<{ maMon: string }>();
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();

  const [tab, setTab] = useState<Tab>(() =>
    searchParams.get('tab') === 'sent' ? 'sent' : 'files'
  );

  const [files,     setFiles]     = useState<ISubjectFile[]>([]);
  const [sentFiles, setSentFiles] = useState<ISubjectFile[]>([]);
  const [loadFiles, setLoadFiles] = useState(true);
  const [loadSent,  setLoadSent]  = useState(true);

  const [showDocsUpload, setShowDocsUpload] = useState(false);
  const [docsUploadType, setDocsUploadType] = useState<IFileType | undefined>();
  const [reviewFile,     setReviewFile]     = useState<ISubjectFile | null>(null);
  const [deleting,       setDeleting]       = useState<Record<string, boolean>>({});
  const [sendingAI,      setSendingAI]      = useState<Record<string, boolean>>({});
  const [working,        setWorking]        = useState<Record<string, boolean>>({});

  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevSentRef = useRef<Record<string, IFileExternalStatus>>({});

  // ── Fetch ──────────────────────────────────────────────
  const fetchFiles = useCallback(async () => {
    if (!maMon) return;
    setLoadFiles(true);
    try { setFiles((await TeacherApi.getSubjectFiles(maMon)).data); }
    catch { toast.error('Không thể tải danh sách tài liệu.'); }
    finally { setLoadFiles(false); }
  }, [maMon]);

  const fetchSent = useCallback(async (silent = false) => {
    if (!maMon) return;
    if (!silent) setLoadSent(true);
    try {
      const list = (await TeacherApi.getSentFiles(maMon)).data;
      list.forEach(f => {
        const prev = prevSentRef.current[f.id];
        const curr = f.external_status ?? null;
        if (prev && prev !== curr) {
          if (curr === 'parsed')  toast(`📄 ${f.original_name} sẵn sàng review`, { icon: '🔵' });
          if (curr === 'success') toast.success(`${f.original_name} đã sẵn sàng trên chatbot AI`);
          if (curr === 'failed')  toast.error(`${f.original_name} xử lý thất bại`);
        }
        prevSentRef.current[f.id] = curr as IFileExternalStatus;
      });
      setSentFiles(list);
    } catch { /* silent */ }
    finally { if (!silent) setLoadSent(false); }
  }, [maMon]);

  // ── Polling ────────────────────────────────────────────
  const startPoll = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => fetchSent(true), 20_000);
  }, [fetchSent]);

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => {
    const needPoll = sentFiles.some(f => POLLING_STATUSES.includes((f.external_status ?? null) as IFileExternalStatus));
    if (needPoll) startPoll(); else stopPoll();
  }, [sentFiles, startPoll, stopPoll]);

  useEffect(() => {
    const h = () => { if (document.hidden) stopPoll(); else startPoll(); };
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, [startPoll, stopPoll]);

  useEffect(() => () => stopPoll(), [stopPoll]);
  useEffect(() => { fetchFiles(); fetchSent(); }, [fetchFiles, fetchSent]);

  // ── Handlers ───────────────────────────────────────────
  const handleDeleteFile = async (fileId: string) => {
    if (!maMon || !confirm('Xóa file này?')) return;
    setDeleting(p => ({ ...p, [fileId]: true }));
    try {
      await TeacherApi.deleteSubjectFile(maMon, fileId);
      toast.success('Đã xóa file.');
      setFiles(p => p.filter(f => f.id !== fileId));
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
      const msg    = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 403) toast.error('Bạn không có quyền xóa file này.');
      else if (status === 422) toast.error('File đã được gửi sang chatbot AI. Xóa khỏi chatbot trước.');
      else toast.error(msg ?? 'Xóa thất bại.');
    } finally {
      setDeleting(p => ({ ...p, [fileId]: false }));
    }
  };

  const handleSendToAI = async (fileId: string) => {
    if (!maMon) return;
    setSendingAI(p => ({ ...p, [fileId]: true }));
    try {
      const r = await TeacherApi.sendToApi(maMon, { fileIds: [fileId] });
      if (r.success) {
        toast.success('Đã đưa file vào hàng chờ AI. Chuyển sang tab Train AI để theo dõi.');
        fetchFiles();
        fetchSent();
        setTab('sent');
      } else {
        toast.error(r.message ?? 'Gửi thất bại.');
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Gửi thất bại.');
    } finally {
      setSendingAI(p => ({ ...p, [fileId]: false }));
    }
  };

  const openUpload = (type: IFileType) => {
    setDocsUploadType(type);
    setShowDocsUpload(true);
  };

  const handleCancel = async (fileId: string) => {
    setWorking(p => ({ ...p, [fileId]: true }));
    try { await TeacherApi.cancelSend(fileId); toast.success('Đã hủy.'); fetchSent(); }
    catch { toast.error('Hủy thất bại.'); }
    finally { setWorking(p => ({ ...p, [fileId]: false })); }
  };

  const handleRetry = async (fileId: string) => {
    setWorking(p => ({ ...p, [fileId]: true }));
    try { await TeacherApi.resendFiles([fileId]); toast.success('Đã xếp lại hàng chờ.'); fetchSent(); }
    catch { toast.error('Thử lại thất bại.'); }
    finally { setWorking(p => ({ ...p, [fileId]: false })); }
  };

  const handleDelLink = async (fileId: string) => {
    if (!maMon || !confirm('Xóa liên kết với chatbot AI?')) return;
    setWorking(p => ({ ...p, [fileId]: true }));
    try { await TeacherApi.deleteFileSentLink(maMon, fileId); toast.success('Đã xóa khỏi AI.'); fetchSent(); }
    catch { toast.error('Xóa thất bại.'); }
    finally { setWorking(p => ({ ...p, [fileId]: false })); }
  };

  const handleSubmitMarkdown = async (fileId: string, markdown: string) => {
    if (!maMon) return;
    try {
      await TeacherApi.submitFile(maMon, fileId, markdown);
      toast.success('Đang gửi tài liệu sang chatbot AI.');
      setReviewFile(null);
      fetchSent();
    } catch { toast.error('Gửi thất bại.'); }
  };

  // ── Derived ────────────────────────────────────────────
  const needPoll = sentFiles.some(f => POLLING_STATUSES.includes((f.external_status ?? null) as IFileExternalStatus));

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#f0f4ff 0%,#e8f0fe 40%,#eff6ff 100%)' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0f172a,#1e3a8a)', position:'sticky', top:0, zIndex:20, boxShadow:'0 2px 16px rgba(15,23,42,0.2)' }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'0 16px', height:56, display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => navigate(-1)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.18)', color:'white', fontSize:'0.78rem', fontWeight:600, cursor:'pointer' }}>
            <ArrowLeft size={13} /> Quay lại
          </button>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:'0.9rem', color:'white' }}>Tài liệu & Train AI</div>
            <div style={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.5)', fontFamily:'monospace' }}>{maMon}</div>
          </div>

          {needPoll && (
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.65rem', color:'rgba(255,255,255,0.5)' }}>
              <Loader2 size={10} style={{ animation:'sf-spin 1s linear infinite' }} /> Đang poll...
            </div>
          )}

          {tab === 'files' && (
            <button onClick={() => openUpload('ly_thuyet')}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:9, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', color:'white', fontSize:'0.78rem', fontWeight:700, cursor:'pointer' }}>
              <Upload size={13} /> Upload
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'16px' }}>
        {/* Stats */}
        <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
          {[
            { label:`${files.length} tài liệu`, color:'#1e3a8a', bg:'rgba(30,58,138,0.07)' },
            { label:`${sentFiles.length} đã gửi AI`, color:'#7c3aed', bg:'rgba(124,58,237,0.07)' },
            { label:`${sentFiles.filter(f=>f.external_status==='success').length} embed thành công`, color:'#059669', bg:'rgba(5,150,105,0.07)' },
          ].map(({ label, color, bg }) => (
            <span key={label} style={{ fontSize:'0.7rem', fontWeight:700, color, background:bg, borderRadius:20, padding:'4px 10px' }}>{label}</span>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:6, marginBottom:14 }}>
          <button className={`sf-tab ${tab==='files'?'active':'inactive'}`} onClick={() => setTab('files')}>
            <FileText size={12} style={{ marginRight:4, verticalAlign:'middle' }} /> Tài liệu
          </button>
          <button className={`sf-tab ${tab==='sent'?'active':'inactive'}`} onClick={() => setTab('sent')}
            style={tab==='sent' ? { background:'linear-gradient(135deg,#4c1d95,#7c3aed)' } : undefined}>
            <Bot size={12} style={{ marginRight:4, verticalAlign:'middle' }} /> Train AI
            {needPoll && <span style={{ marginLeft:5, width:6, height:6, borderRadius:'50%', background:'#f59e0b', display:'inline-block' }} />}
          </button>
        </div>

        {/* Tab content */}
        {tab === 'files' ? (
          <FilesTab
            files={files}
            loading={loadFiles}
            onUpload={openUpload}
            onDelete={handleDeleteFile}
            onSendToAI={handleSendToAI}
            deleting={deleting}
            sendingAI={sendingAI}
          />
        ) : (
          <SentTab maMon={maMon!} files={sentFiles} loading={loadSent} onRefresh={() => fetchSent()} onGoToFiles={() => setTab('files')}
            onReview={setReviewFile} onCancel={handleCancel} onRetry={handleRetry} onDelLink={handleDelLink} working={working} />
        )}
      </div>

      {/* Modals */}
      {showDocsUpload && (
        <UploadDocsModal
          maMon={maMon!}
          defaultType={docsUploadType}
          onClose={() => { setShowDocsUpload(false); setDocsUploadType(undefined); }}
          onSuccess={fetchFiles}
        />
      )}
      {reviewFile && (
        <MarkdownModal
          maMon={maMon!}
          file={reviewFile}
          onClose={() => setReviewFile(null)}
          onSubmit={handleSubmitMarkdown}
        />
      )}
    </div>
  );
};

export default TeacherSubjectFiles;
