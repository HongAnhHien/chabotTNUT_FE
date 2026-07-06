import { type FC, type ChangeEvent, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { IFileType } from '@/infra/api/interfaces/ITeacher';
import { FILE_TYPES } from '../constants';
import { fmtSize } from '../helpers';
import { ExtBadge, Toggle, Spinner } from './shared';

interface FileItem { file: File; type: IFileType; isPrivate: boolean }

interface Props {
  maMon: string;
  defaultType?: IFileType;
  onClose: () => void;
  onSuccess: () => void;
}

const UploadModal: FC<Props> = ({ maMon, defaultType, onClose, onSuccess }) => {
  const [items, setItems]       = useState<FileItem[]>([]);
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [drag, setDrag]         = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setItems(prev => {
      const ex = new Set(prev.map(i => i.file.name + i.file.size));
      return [...prev, ...Array.from(list).filter(f => !ex.has(f.name + f.size)).map(f => ({
        file: f, type: defaultType ?? 'ly_thuyet', isPrivate: false,
      }))];
    });
  };

  const removeItem    = (idx: number) => setItems(p => p.filter((_,i) => i !== idx));
  const updateType    = (idx: number, t: IFileType) => setItems(p => p.map((it,i) => i===idx ? {...it,type:t} : it));
  const updatePrivate = (idx: number, v: boolean)   => setItems(p => p.map((it,i) => i===idx ? {...it,isPrivate:v} : it));
  const setAllPrivate = (v: boolean) => setItems(p => p.map(it => ({...it, isPrivate:v})));

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
          toast.error(`"${it.file.name}": File loại này đã được ${resp.data.uploaded_by} upload.`, { duration:6000 });
        } else { failed.push(it.file.name); }
      }
    }
    setLoading(false); setProgress(null);
    if (failed.length) toast.error(`Upload thất bại ${failed.length} file`);
    if (done > 0) { toast.success(`Upload xong ${done}/${items.length} file`); onSuccess(); onClose(); }
  };

  return (
    <div className="tdf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tdf-panel" style={{ width:'min(720px,96vw)' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'20px 24px', borderBottom:'1px solid #f1f5f9' }}>
          <div style={{ width:38, height:38, borderRadius:11, background:'#eff5ff', color:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center' }}><Upload size={18} /></div>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:'#0f172a' }}>Upload tài liệu</div>
            <div style={{ fontSize:12.5, color:'#94a3b8', marginTop:2 }}>Thêm file vào môn học</div>
          </div>
          <button onClick={onClose} style={{ marginLeft:'auto', width:34, height:34, borderRadius:10, border:'1px solid #e7ecf3', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}><X size={16} /></button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16, overflowY:'auto', maxHeight:'60vh' }}>
          {/* Drop zone */}
          <div className={`tdf-drop${drag ? ' over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}>
            <input ref={inputRef} type="file" multiple style={{ display:'none' }} onChange={(e: ChangeEvent<HTMLInputElement>) => addFiles(e.target.files)} />
            <div style={{ width:56, height:56, borderRadius:16, background:'#eff5ff', color:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}><Upload size={26} /></div>
            <div style={{ fontSize:15.5, fontWeight:700, color:'#1e293b' }}>Kéo thả hoặc click để chọn file</div>
            <div style={{ fontSize:12.5, color:'#94a3b8', marginTop:5 }}>PDF, DOCX, PPTX và các định dạng khác</div>
          </div>

          {/* File list */}
          {items.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:12.5, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:.4 }}>Đã chọn ({items.length})</span>
                <div style={{ display:'flex', gap:7, alignItems:'center' }}>
                  <span style={{ fontSize:11.5, color:'#94a3b8' }}>Ẩn HS:</span>
                  <button onClick={() => setAllPrivate(false)} style={{ fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:8, border:'1px solid #e7ecf3', background:'#fff', color:'#64748b', cursor:'pointer', fontFamily:'inherit' }}>Tắt</button>
                  <button onClick={() => setAllPrivate(true)}  style={{ fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:8, border:'1px solid #dbeafe', background:'#eff5ff', color:'#2563eb', cursor:'pointer', fontFamily:'inherit' }}>Bật</button>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:240, overflowY:'auto' }}>
                {items.map((it, idx) => (
                  <div key={idx} className="tdf-upload-item">
                    <ExtBadge name={it.file.name} size={38} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13.5, fontWeight:600, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{it.file.name}</div>
                      <div style={{ fontSize:11.5, color:'#94a3b8', marginTop:2 }}>
                        {fmtSize(it.file.size)}{it.isPrivate && <span style={{ marginLeft:6, color:'#d97706', fontWeight:700 }}>· Ẩn</span>}
                      </div>
                    </div>
                    <select value={it.type} onChange={e => updateType(idx, e.target.value as IFileType)}
                      style={{ height:36, border:'1px solid #e7ecf3', borderRadius:9, padding:'0 10px', fontFamily:'inherit', fontSize:12.5, color:'#334155', background:'#fff', cursor:'pointer' }}>
                      {FILE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <Toggle checked={it.isPrivate} onChange={v => updatePrivate(idx, v)} />
                    <button onClick={() => removeItem(idx)} style={{ background:'none', border:'none', cursor:'pointer', color:'#cbd5e1', padding:0, display:'flex' }}><X size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {progress && (
            <div>
              <div style={{ fontSize:12.5, color:'#64748b', marginBottom:4 }}>Đang upload {progress.done}/{progress.total}...</div>
              <div style={{ height:4, background:'rgba(37,99,235,.1)', borderRadius:4 }}>
                <div style={{ height:'100%', background:'linear-gradient(90deg,#1e3a8a,#2563eb)', borderRadius:4, width:`${(progress.done/progress.total)*100}%`, transition:'width .3s' }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 24px', borderTop:'1px solid #f1f5f9', background:'#fbfcfe' }}>
          <span style={{ fontSize:12.5, color:'#64748b' }}>{items.length} file · <b style={{ color:'#0f172a' }}>{fmtSize(items.reduce((s,i) => s+i.file.size, 0))}</b></span>
          <div style={{ marginLeft:'auto', display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ height:42, padding:'0 18px', borderRadius:11, border:'1px solid #e7ecf3', background:'#fff', color:'#475569', fontWeight:600, fontSize:13.5, fontFamily:'inherit', cursor:'pointer' }}>Hủy</button>
            <button onClick={handleSubmit} disabled={!items.length || loading} className="tdf-primary" style={{ height:42, fontSize:13.5 }}>
              {loading ? <><Spinner size={15} color="#fff" /> Đang upload...</> : <><Upload size={15} /> Upload ({items.length})</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
