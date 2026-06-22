import {
  type FC, type ChangeEvent,
  useCallback, useEffect, useRef, useState,
} from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  ArrowLeft, Upload, RefreshCw, Download, Trash2,
  Eye, Send, Clock, CheckCircle, XCircle, Loader2,
  FileText, AlertCircle, X, Plus, List, Bot,
  Image, Film, Archive, FileSpreadsheet, Sparkles,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type {
  ISubjectFile, IFileType, IFileExternalStatus,
  ISubmitBatchItem,
} from '@/infra/api/interfaces/ITeacher';

// ── CSS ─────────────────────────────────────────────────
const CSS = `
  @keyframes sf-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes sf-spin{to{transform:rotate(360deg)}}
  @keyframes sf-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  @keyframes sf-drop-pulse{0%,100%{border-color:rgba(37,99,235,0.3)}50%{border-color:#2563eb}}
  .sf-row{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(37,99,235,0.05);transition:background .13s}
  .sf-row:last-child{border-bottom:none}
  .sf-row:hover{background:rgba(37,99,235,0.02)}
  .sf-btn{display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border-radius:7px;font-size:0.68rem;font-weight:700;cursor:pointer;border:none;transition:opacity .14s,transform .1s;white-space:nowrap}
  .sf-btn:hover{opacity:.85;transform:scale(1.02)}
  .sf-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
  .sf-tab{padding:8px 18px;border-radius:10px;font-size:0.8rem;font-weight:700;cursor:pointer;border:none;transition:all .15s}
  .sf-tab.active{background:linear-gradient(135deg,#1e3a8a,#2563eb);color:white}
  .sf-tab.inactive{background:rgba(37,99,235,0.06);color:#64748b}
  .sf-tab.inactive:hover{background:rgba(37,99,235,0.1);color:#2563eb}
  .sf-drop-zone{border:2px dashed rgba(37,99,235,0.25);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 20px;cursor:pointer;transition:border-color .15s,background .15s}
  .sf-drop-zone.drag-over{border-color:#2563eb;background:rgba(37,99,235,0.04);animation:sf-drop-pulse 1s ease infinite}
  .sf-drop-zone:hover{border-color:rgba(37,99,235,0.5);background:rgba(37,99,235,0.02)}
  .sf-modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}
  .sf-modal{background:white;border-radius:18px;width:100%;max-width:560px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 24px 60px rgba(0,0,0,0.18);animation:sf-fade .25s ease}
  .sf-md-modal{max-width:760px}
  .sf-skeleton{border-radius:10px;height:52px;background:linear-gradient(90deg,#f0f4ff 25%,#e8f0fe 50%,#f0f4ff 75%);background-size:200% 100%;animation:sf-shimmer 1.4s ease infinite}
  .sf-file-check{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:9px;border:1.5px solid transparent;cursor:pointer;transition:all .12s}
  .sf-file-check:hover{background:rgba(124,58,237,0.03)}
  .sf-file-check.checked{background:rgba(124,58,237,0.05);border-color:rgba(124,58,237,0.2)}
`;

// ── Constants ─────────────────────────────────────────────
type Tab = 'files' | 'sent';
const POLLING_STATUSES: IFileExternalStatus[] = ['pending', 'send_queued', 'sending'];
const AI_ACCEPTED = '.pdf,.doc,.docx';

const FILE_TYPES: { value: IFileType; label: string }[] = [
  { value: 'de_cuong',          label: 'Đề cương môn học' },
  { value: 'ly_thuyet',         label: 'Tài liệu lý thuyết' },
  { value: 'ma_tran_cau_hoi',   label: 'Ma trận câu hỏi' },
  { value: 'ngan_hang_cau_hoi', label: 'Ngân hàng câu hỏi' },
  { value: 'khac',              label: 'Khác' },
];

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

const extOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

const FileIcon: FC<{ name: string; size?: number; color?: string }> = ({ name, size = 15, color }) => {
  const ext = extOf(name);
  if (/^(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(ext))
    return <Image size={size} color={color ?? '#0891b2'} />;
  if (/^(mp4|mkv|avi|mov|webm|flv)$/.test(ext))
    return <Film size={size} color={color ?? '#7c3aed'} />;
  if (/^(zip|rar|7z|tar|gz)$/.test(ext))
    return <Archive size={size} color={color ?? '#d97706'} />;
  if (/^(xls|xlsx|csv)$/.test(ext))
    return <FileSpreadsheet size={size} color={color ?? '#059669'} />;
  return <FileText size={size} color={color ?? '#2563eb'} />;
};

const iconBgOf = (name: string) => {
  const ext = extOf(name);
  if (/^(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(ext)) return 'rgba(8,145,178,0.08)';
  if (/^(mp4|mkv|avi|mov|webm|flv)$/.test(ext))           return 'rgba(124,58,237,0.08)';
  if (/^(zip|rar|7z|tar|gz)$/.test(ext))                  return 'rgba(217,119,6,0.08)';
  if (/^(xls|xlsx|csv)$/.test(ext))                       return 'rgba(5,150,105,0.08)';
  return 'rgba(37,99,235,0.07)';
};

const isAiCompatible = (name: string) => /\.(pdf|doc|docx)$/i.test(name);

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
// All file types, multiple files, type selector, no AI option
const UploadDocsModal: FC<{ maMon: string; onClose: () => void; onSuccess: () => void }> = ({ maMon, onClose, onSuccess }) => {
  const [files,     setFiles]     = useState<File[]>([]);
  const [fileType,  setFileType]  = useState<IFileType>('ly_thuyet');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [drag,      setDrag]      = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles(p => {
      const existing = new Set(p.map(f => f.name + f.size));
      const next = Array.from(list).filter(f => !existing.has(f.name + f.size));
      return [...p, ...next];
    });
  };

  const handleSubmit = async () => {
    if (!files.length) return;
    setLoading(true);
    let done = 0;
    const failed: string[] = [];
    for (const f of files) {
      try {
        await TeacherApi.uploadSubjectFile(maMon, f, fileType, isPrivate);
        done++;
        setProgress(Math.round((done / files.length) * 100));
      } catch { failed.push(f.name); }
    }
    setLoading(false);
    if (failed.length) toast.error(`Lỗi ${failed.length} file: ${failed.slice(0,2).join(', ')}${failed.length > 2 ? '...' : ''}`);
    if (done > 0) { toast.success(`Upload xong ${done}/${files.length} file`); onSuccess(); onClose(); }
  };

  return (
    <div className="sf-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sf-modal">
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 20px', borderBottom:'1px solid rgba(37,99,235,0.08)' }}>
          <div style={{ flex:1, fontWeight:800, fontSize:'0.95rem', color:'#1e293b' }}>Upload tài liệu</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:4 }}><X size={16} /></button>
        </div>

        <div style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:14, overflowY:'auto' }}>
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
            <Upload size={26} color="#94a3b8" />
            <div style={{ marginTop:8, fontWeight:700, color:'#64748b', fontSize:'0.85rem' }}>Kéo thả hoặc click để chọn file</div>
            <div style={{ fontSize:'0.68rem', color:'#94a3b8', marginTop:4 }}>Hỗ trợ tất cả loại file · Nhiều file cùng lúc</div>
          </div>

          {/* Selected files */}
          {files.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:160, overflowY:'auto' }}>
              {files.map((f, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', background:'rgba(37,99,235,0.04)', borderRadius:8 }}>
                  <FileIcon name={f.name} size={13} />
                  <span style={{ flex:1, fontSize:'0.75rem', fontWeight:600, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
                  <span style={{ fontSize:'0.62rem', color:'#94a3b8', flexShrink:0 }}>{fmtSize(f.size)}</span>
                  <button onClick={() => setFiles(p => p.filter((_, j) => j !== i))}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0, flexShrink:0 }}><X size={11} /></button>
                </div>
              ))}
            </div>
          )}

          {/* Type */}
          <div>
            <label style={{ fontSize:'0.75rem', fontWeight:700, color:'#475569', display:'block', marginBottom:5 }}>Loại tài liệu *</label>
            <select value={fileType} onChange={e => setFileType(e.target.value as IFileType)}
              style={{ width:'100%', padding:'8px 10px', borderRadius:9, border:'1.5px solid rgba(37,99,235,0.2)', fontSize:'0.82rem', color:'#1e293b', background:'white', outline:'none' }}>
              {FILE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Private */}
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'0.8rem', color:'#475569', fontWeight:500 }}>
            <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)}
              style={{ width:15, height:15, accentColor:'#2563eb', cursor:'pointer' }} />
            Ẩn khỏi học sinh
          </label>

          {/* Progress */}
          {loading && (
            <div>
              <div style={{ fontSize:'0.72rem', color:'#64748b', marginBottom:4 }}>Đang upload... {progress}%</div>
              <div style={{ height:4, background:'rgba(37,99,235,0.1)', borderRadius:4 }}>
                <div style={{ height:'100%', background:'linear-gradient(90deg,#1e3a8a,#2563eb)', borderRadius:4, width:`${progress}%`, transition:'width .3s' }} />
              </div>
            </div>
          )}
        </div>

        <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(37,99,235,0.08)', display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} className="sf-btn" style={{ background:'rgba(37,99,235,0.07)', color:'#2563eb' }}>Hủy</button>
          <button onClick={handleSubmit} disabled={!files.length || loading} className="sf-btn"
            style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', color:'white', padding:'6px 16px' }}>
            {loading
              ? <><Loader2 size={11} style={{ animation:'sf-spin 1s linear infinite' }} /> Đang upload...</>
              : <><Upload size={11} /> Upload {files.length > 0 ? `(${files.length})` : ''}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Upload AI Modal ───────────────────────────────────────
// Word/PDF only, multiple files + select from existing docs
interface UploadAIModalProps {
  maMon: string;
  existingFiles: ISubjectFile[];
  sentFileIds: Set<string>;
  onClose: () => void;
  onSuccess: () => void;
}

const UploadAIModal: FC<UploadAIModalProps> = ({ maMon, existingFiles, sentFileIds, onClose, onSuccess }) => {
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [selIds,   setSelIds]   = useState<Set<string>>(new Set());
  const [loading,  setLoading]  = useState(false);
  const [drag,     setDrag]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const aiFiles = existingFiles.filter(f => isAiCompatible(f.original_name) && !sentFileIds.has(f.id));

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const valid = Array.from(list).filter(f => isAiCompatible(f.name));
    const invalid = Array.from(list).length - valid.length;
    if (invalid) toast.error(`Bỏ qua ${invalid} file không hợp lệ (chỉ nhận PDF, Word)`);
    setNewFiles(p => {
      const existing = new Set(p.map(f => f.name + f.size));
      return [...p, ...valid.filter(f => !existing.has(f.name + f.size))];
    });
  };

  const toggleSel = (id: string) =>
    setSelIds(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleSubmit = async () => {
    if (!newFiles.length && !selIds.size) return;
    setLoading(true);
    try {
      const collectedIds: string[] = [...selIds];

      // Upload new files first
      for (const f of newFiles) {
        try {
          const r = await TeacherApi.uploadSubjectFile(maMon, f, 'ly_thuyet', false);
          if (r.success) collectedIds.push(r.data.id);
        } catch { toast.error(`Upload thất bại: ${f.name}`); }
      }

      if (!collectedIds.length) { toast.error('Không có file nào để gửi.'); return; }

      const r = await TeacherApi.sendToApi(maMon, { fileIds: collectedIds });
      if (r.success) {
        toast.success(`Đã gửi ${collectedIds.length} file vào hàng chờ AI.`);
        onSuccess();
        onClose();
      } else {
        toast.error(r.message ?? 'Gửi thất bại.');
      }
    } catch (e: unknown) {
      const msg = (e as {response?:{data?:{message?:string}}})?.response?.data?.message;
      toast.error(msg ?? 'Gửi thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const total = newFiles.length + selIds.size;

  return (
    <div className="sf-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sf-modal" style={{ maxWidth:580 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 20px', borderBottom:'1px solid rgba(124,58,237,0.1)' }}>
          <Sparkles size={16} color="#7c3aed" />
          <div style={{ flex:1, fontWeight:800, fontSize:'0.95rem', color:'#1e293b' }}>Gửi tài liệu vào AI</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:4 }}><X size={16} /></button>
        </div>

        <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:16, overflowY:'auto' }}>
          {/* Upload mới */}
          <div>
            <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
              Upload file mới (PDF, Word)
            </div>
            <div
              className={`sf-drop-zone${drag ? ' drag-over' : ''}`}
              style={{ padding:'20px 16px' }}
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
            >
              <input ref={inputRef} type="file" multiple accept={AI_ACCEPTED} style={{ display:'none' }}
                onChange={(e: ChangeEvent<HTMLInputElement>) => addFiles(e.target.files)} />
              <Upload size={22} color="#c4b5fd" />
              <div style={{ marginTop:6, fontWeight:600, color:'#6b7280', fontSize:'0.8rem' }}>PDF, Word · Nhiều file</div>
            </div>

            {newFiles.length > 0 && (
              <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:3, maxHeight:110, overflowY:'auto' }}>
                {newFiles.map((f, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:7, padding:'4px 8px', background:'rgba(124,58,237,0.05)', borderRadius:7 }}>
                    <FileText size={12} color="#7c3aed" />
                    <span style={{ flex:1, fontSize:'0.73rem', fontWeight:600, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
                    <span style={{ fontSize:'0.6rem', color:'#94a3b8', flexShrink:0 }}>{fmtSize(f.size)}</span>
                    <button onClick={() => setNewFiles(p => p.filter((_, j) => j !== i))}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0 }}><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chọn từ tài liệu hiện có */}
          {aiFiles.length > 0 && (
            <div>
              <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
                Chọn từ tài liệu đã có
                {selIds.size > 0 && <span style={{ marginLeft:6, background:'#7c3aed', color:'white', borderRadius:20, padding:'1px 7px', fontSize:'0.62rem' }}>{selIds.size}</span>}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:3, maxHeight:180, overflowY:'auto' }}>
                {aiFiles.map(f => (
                  <label key={f.id} className={`sf-file-check${selIds.has(f.id) ? ' checked' : ''}`} onClick={() => toggleSel(f.id)}>
                    <input type="checkbox" checked={selIds.has(f.id)} onChange={() => {}}
                      style={{ accentColor:'#7c3aed', cursor:'pointer', flexShrink:0, width:14, height:14 }} />
                    <FileText size={12} color="#7c3aed" />
                    <span style={{ flex:1, fontSize:'0.75rem', fontWeight:600, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.original_name}</span>
                    <span style={{ fontSize:'0.6rem', color:'#94a3b8', flexShrink:0 }}>{fmtSize(f.file_size)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {aiFiles.length === 0 && newFiles.length === 0 && (
            <div style={{ textAlign:'center', padding:'8px 0', fontSize:'0.78rem', color:'#94a3b8' }}>
              Chưa có file PDF hoặc Word nào trong tài liệu môn học.
            </div>
          )}
        </div>

        <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(124,58,237,0.1)', display:'flex', gap:8, justifyContent:'flex-end', alignItems:'center' }}>
          {total > 0 && <span style={{ fontSize:'0.72rem', color:'#7c3aed', fontWeight:700, flex:1 }}>{total} file sẽ được gửi</span>}
          <button onClick={onClose} className="sf-btn" style={{ background:'rgba(124,58,237,0.07)', color:'#7c3aed' }}>Hủy</button>
          <button onClick={handleSubmit} disabled={total === 0 || loading} className="sf-btn"
            style={{ background:'linear-gradient(135deg,#4c1d95,#7c3aed)', color:'white', padding:'6px 16px' }}>
            {loading
              ? <><Loader2 size={11} style={{ animation:'sf-spin 1s linear infinite' }} /> Đang gửi...</>
              : <><Sparkles size={11} /> Gửi vào AI</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Markdown Review Modal ─────────────────────────────────
interface MarkdownModalProps {
  maMon: string;
  file: ISubjectFile;
  batchIds: string[];
  onClose: () => void;
  onSubmitSingle: (fileId: string, markdown: string) => void;
  onAddToBatch:   (item: ISubmitBatchItem) => void;
  onSubmitBatch:  () => void;
}

const MarkdownModal: FC<MarkdownModalProps> = ({ maMon, file, batchIds, onClose, onSubmitSingle, onAddToBatch, onSubmitBatch }) => {
  const [markdown, setMarkdown] = useState('');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    TeacherApi.getFileMarkdown(maMon, file.id)
      .then(r => setMarkdown(r.data.markdown))
      .catch(() => toast.error('Không thể tải markdown.'))
      .finally(() => setLoading(false));
  }, [maMon, file.id]);

  const alreadyInBatch = batchIds.includes(file.id);

  return (
    <div className="sf-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sf-modal sf-md-modal">
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 18px', borderBottom:'1px solid rgba(37,99,235,0.08)', flexShrink:0 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:'0.9rem', color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file.original_name}</div>
            <div style={{ fontSize:'0.65rem', color:'#94a3b8', marginTop:1 }}>Xem & chỉnh sửa markdown trước khi gửi AI</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', flexShrink:0 }}><X size={16} /></button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'12px 18px' }}>
          {loading
            ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200 }}>
                <Loader2 size={24} color="#2563eb" style={{ animation:'sf-spin 1s linear infinite' }} />
              </div>
            : <textarea value={markdown} onChange={e => setMarkdown(e.target.value)}
                style={{ width:'100%', minHeight:320, padding:'10px 12px', borderRadius:10, border:'1.5px solid rgba(37,99,235,0.15)', fontSize:'0.78rem', fontFamily:'monospace', lineHeight:1.6, color:'#1e293b', resize:'vertical', outline:'none', background:'#fafbff', boxSizing:'border-box' }} />
          }
        </div>
        <div style={{ padding:'12px 18px', borderTop:'1px solid rgba(37,99,235,0.08)', display:'flex', gap:7, flexWrap:'wrap', alignItems:'center', flexShrink:0 }}>
          {batchIds.length > 0 && (
            <button onClick={onSubmitBatch} className="sf-btn" style={{ background:'linear-gradient(135deg,#059669,#10b981)', color:'white', padding:'6px 12px' }}>
              <Send size={11} /> Gửi tất cả ({batchIds.length})
            </button>
          )}
          <button onClick={() => onAddToBatch({ id: file.id, markdown })} disabled={alreadyInBatch || loading} className="sf-btn"
            style={{ background:alreadyInBatch ? 'rgba(5,150,105,0.08)' : 'rgba(8,145,178,0.08)', color:alreadyInBatch ? '#059669' : '#0891b2' }}>
            {alreadyInBatch ? <><CheckCircle size={10} /> Đã thêm vào batch</> : <><Plus size={10} /> Thêm vào hàng chờ</>}
          </button>
          <div style={{ flex:1 }} />
          <button onClick={onClose} className="sf-btn" style={{ background:'rgba(100,116,139,0.08)', color:'#64748b' }}>Đóng</button>
          <button onClick={() => onSubmitSingle(file.id, markdown)} disabled={loading || !markdown} className="sf-btn"
            style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', color:'white', padding:'6px 14px' }}>
            <Send size={10} /> Gửi file này
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Files Tab ─────────────────────────────────────────────
// Chỉ quản lý file tài liệu - không liên quan AI
const FilesTab: FC<{
  files: ISubjectFile[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (fileId: string) => void;
  deleting: Record<string, boolean>;
}> = ({ files, loading, onRefresh, onDelete, deleting }) => {

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'12px 0' }}>
      {[1,2,3].map(i => <div key={i} className="sf-skeleton" style={{ animationDelay:`${i*0.08}s` }} />)}
    </div>
  );

  if (!files.length) return (
    <div style={{ textAlign:'center', padding:'3rem 1rem' }}>
      <FileText size={40} color="#bfdbfe" style={{ margin:'0 auto 10px', display:'block' }} />
      <div style={{ fontSize:'0.88rem', fontWeight:700, color:'#1e293b' }}>Chưa có tài liệu nào</div>
      <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:4 }}>Bấm "Upload" để thêm tài liệu.</div>
    </div>
  );

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
        <button onClick={onRefresh} className="sf-btn" style={{ background:'rgba(37,99,235,0.07)', color:'#2563eb' }}>
          <RefreshCw size={11} /> Làm mới
        </button>
      </div>
      <div style={{ background:'white', borderRadius:14, border:'1px solid rgba(37,99,235,0.08)', overflow:'hidden' }}>
        {files.map(f => (
          <div key={f.id} className="sf-row">
            {/* Icon */}
            <div style={{ flexShrink:0, width:36, height:36, borderRadius:10, background:iconBgOf(f.original_name), display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FileIcon name={f.original_name} />
            </div>

            {/* Info */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:'0.8rem', color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.original_name}</div>
              <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:2, flexWrap:'wrap' }}>
                <span style={{ fontSize:'0.62rem', fontWeight:700, color:'#7c3aed', background:'rgba(124,58,237,0.07)', borderRadius:20, padding:'1px 6px' }}>{f.type_label}</span>
                <span style={{ fontSize:'0.62rem', color:'#94a3b8' }}>{fmtSize(f.file_size)}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display:'flex', gap:5, flexShrink:0 }}>
              {f.download_url && (
                <a href={f.download_url} target="_blank" rel="noreferrer" className="sf-btn"
                  style={{ background:'rgba(37,99,235,0.07)', color:'#2563eb', textDecoration:'none' }}
                  title="Xem / tải file">
                  <ExternalLink size={10} /> Xem
                </a>
              )}
              <a href={f.download_url} download className="sf-btn"
                style={{ background:'rgba(37,99,235,0.05)', color:'#64748b', textDecoration:'none' }}
                title="Tải xuống">
                <Download size={10} />
              </a>
              <button onClick={() => onDelete(f.id)} disabled={!!deleting[f.id]} className="sf-btn"
                style={{ background:'rgba(220,38,38,0.07)', color:'#dc2626' }}>
                {deleting[f.id] ? <Loader2 size={10} style={{ animation:'sf-spin 1s linear infinite' }} /> : <Trash2 size={10} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Sent Tab (Train AI) ───────────────────────────────────
// Danh sách tài liệu đã gửi đến API bên thứ 3
const SentTab: FC<{
  maMon: string;
  files: ISubjectFile[];
  loading: boolean;
  onRefresh: () => void;
  onReview: (f: ISubjectFile) => void;
  onCancel: (fileId: string) => void;
  onRetry:  (fileId: string) => void;
  onDelLink:(fileId: string) => void;
  working: Record<string, boolean>;
}> = ({ files, loading, onRefresh, onReview, onCancel, onRetry, onDelLink, working }) => {

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'12px 0' }}>
      {[1,2,3].map(i => <div key={i} className="sf-skeleton" style={{ animationDelay:`${i*0.08}s` }} />)}
    </div>
  );

  if (!files.length) return (
    <div style={{ textAlign:'center', padding:'3rem 1rem' }}>
      <Bot size={40} color="#c4b5fd" style={{ margin:'0 auto 10px', display:'block' }} />
      <div style={{ fontSize:'0.88rem', fontWeight:700, color:'#1e293b' }}>Chưa có file nào gửi AI</div>
      <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:4 }}>Bấm "Gửi vào AI" để gửi tài liệu lên chatbot.</div>
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
            <div key={f.id} className="sf-row">
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
  const [files,         setFiles]        = useState<ISubjectFile[]>([]);
  const [sentFiles,     setSentFiles]    = useState<ISubjectFile[]>([]);
  const [loadFiles,     setLoadFiles]    = useState(true);
  const [loadSent,      setLoadSent]     = useState(true);
  const [showDocsUpload,setShowDocsUpload] = useState(false);
  const [showAIUpload,  setShowAIUpload] = useState(false);
  const [reviewFile,    setReviewFile]   = useState<ISubjectFile | null>(null);
  const [batch,         setBatch]        = useState<ISubmitBatchItem[]>([]);
  const [deleting,      setDeleting]     = useState<Record<string, boolean>>({});
  const [working,       setWorking]      = useState<Record<string, boolean>>({});
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevSentRef = useRef<Record<string, IFileExternalStatus>>({});

  const subjectName = files[0]?.ma_mon ?? sentFiles[0]?.ma_mon ?? maMon ?? '';

  // ── Fetch ─────────────────────────────────────────────
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

  // ── Polling ───────────────────────────────────────────
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

  // ── Handlers ──────────────────────────────────────────
  const handleDeleteFile = async (fileId: string) => {
    if (!maMon || !confirm('Xóa file này?')) return;
    setDeleting(p => ({ ...p, [fileId]: true }));
    try { await TeacherApi.deleteSubjectFile(maMon, fileId); toast.success('Đã xóa file.'); setFiles(p => p.filter(f => f.id !== fileId)); }
    catch { toast.error('Xóa thất bại.'); }
    finally { setDeleting(p => ({ ...p, [fileId]: false })); }
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

  const handleSubmitSingle = async (fileId: string, markdown: string) => {
    if (!maMon) return;
    try { await TeacherApi.submitFile(maMon, fileId, markdown); toast.success('Đang gửi tài liệu sang chatbot AI.'); setReviewFile(null); fetchSent(); }
    catch { toast.error('Gửi thất bại.'); }
  };

  const handleAddToBatch = (item: ISubmitBatchItem) => {
    setBatch(p => p.find(x => x.id === item.id) ? p : [...p, item]);
    toast(`Đã thêm vào hàng chờ (${batch.length + 1} file)`, { icon: '📋' });
  };

  const handleSubmitBatch = async () => {
    if (!maMon || !batch.length) return;
    try {
      const r = await TeacherApi.submitBatch(maMon, batch);
      toast.success(r.message ?? `Đã xếp ${batch.length} file vào hàng chờ.`);
      setBatch([]); setReviewFile(null); fetchSent();
    } catch { toast.error('Gửi batch thất bại.'); }
  };

  // ── Render ────────────────────────────────────────────
  const needPoll = sentFiles.some(f => POLLING_STATUSES.includes((f.external_status ?? null) as IFileExternalStatus));
  const sentIds  = new Set(sentFiles.map(f => f.id));

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#f0f4ff 0%,#e8f0fe 40%,#eff6ff 100%)' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0f172a,#1e3a8a)', position:'sticky', top:0, zIndex:20, boxShadow:'0 2px 16px rgba(15,23,42,0.2)' }}>
        <div style={{ maxWidth:880, margin:'0 auto', padding:'0 16px', height:56, display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => navigate(-1)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.18)', color:'white', fontSize:'0.78rem', fontWeight:600, cursor:'pointer' }}>
            <ArrowLeft size={13} /> Quay lại
          </button>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:'0.9rem', color:'white' }}>Tài liệu & Train AI</div>
            <div style={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.5)', fontFamily:'monospace' }}>{subjectName || maMon}</div>
          </div>

          {batch.length > 0 && (
            <button onClick={handleSubmitBatch}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:8, background:'rgba(5,150,105,0.2)', border:'1px solid rgba(5,150,105,0.35)', color:'#6ee7b7', fontSize:'0.72rem', fontWeight:700, cursor:'pointer' }}>
              <List size={11} /> Gửi batch ({batch.length})
            </button>
          )}

          {needPoll && (
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.65rem', color:'rgba(255,255,255,0.5)' }}>
              <Loader2 size={10} style={{ animation:'sf-spin 1s linear infinite' }} /> Đang poll...
            </div>
          )}

          {/* Upload button changes per tab */}
          {tab === 'files' ? (
            <button onClick={() => setShowDocsUpload(true)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:9, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', color:'white', fontSize:'0.78rem', fontWeight:700, cursor:'pointer' }}>
              <Upload size={13} /> Upload
            </button>
          ) : (
            <button onClick={() => setShowAIUpload(true)}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:9, background:'rgba(196,181,253,0.2)', border:'1px solid rgba(196,181,253,0.3)', color:'#e9d5ff', fontSize:'0.78rem', fontWeight:700, cursor:'pointer' }}>
              <Sparkles size={13} /> Gửi vào AI
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth:880, margin:'0 auto', padding:'16px' }}>
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
          <FilesTab files={files} loading={loadFiles} onRefresh={fetchFiles}
            onDelete={handleDeleteFile} deleting={deleting} />
        ) : (
          <SentTab maMon={maMon!} files={sentFiles} loading={loadSent} onRefresh={() => fetchSent()}
            onReview={setReviewFile} onCancel={handleCancel} onRetry={handleRetry} onDelLink={handleDelLink} working={working} />
        )}
      </div>

      {/* Modals */}
      {showDocsUpload && (
        <UploadDocsModal maMon={maMon!} onClose={() => setShowDocsUpload(false)} onSuccess={fetchFiles} />
      )}
      {showAIUpload && (
        <UploadAIModal
          maMon={maMon!}
          existingFiles={files}
          sentFileIds={sentIds}
          onClose={() => setShowAIUpload(false)}
          onSuccess={() => { fetchFiles(); fetchSent(); }}
        />
      )}
      {reviewFile && (
        <MarkdownModal maMon={maMon!} file={reviewFile} batchIds={batch.map(b => b.id)}
          onClose={() => setReviewFile(null)} onSubmitSingle={handleSubmitSingle}
          onAddToBatch={handleAddToBatch} onSubmitBatch={handleSubmitBatch} />
      )}
    </div>
  );
};

export default TeacherSubjectFiles;
