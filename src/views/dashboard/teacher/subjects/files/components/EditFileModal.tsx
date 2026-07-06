import { type FC, useState } from 'react';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { ISubjectFile, IFileType } from '@/infra/api/interfaces/ITeacher';
import { FILE_TYPES } from '../constants';
import { ExtBadge, Toggle, Spinner } from './shared';

interface Props {
  maMon: string;
  file: ISubjectFile;
  onClose: () => void;
  onSuccess: (updated: ISubjectFile) => void;
}

const EditFileModal: FC<Props> = ({ maMon, file, onClose, onSuccess }) => {
  const [name,      setName]      = useState(file.original_name ?? '');
  const [type,      setType]      = useState<IFileType>(file.type);
  const [isPrivate, setIsPrivate] = useState(!!file.is_private);
  const [saving,    setSaving]    = useState(false);

  const handleSave = () => {
    if (!name.trim()) { toast.error('Tên tài liệu không được để trống.'); return; }
    setSaving(true);
    TeacherApi.updateSubjectFile(maMon, file.id, {
      type,
      is_private: isPrivate ? '1' : '0',
      original_name: name.trim(),
    })
      .then(r => {
        toast.success('Đã cập nhật tài liệu.');
        onSuccess(r.data);
        onClose();
      })
      .catch(e => {
        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(msg ?? 'Cập nhật thất bại.');
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="tdf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tdf-panel" style={{ width:'min(480px,96vw)' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'18px 22px', borderBottom:'1px solid #f1f5f9' }}>
          <ExtBadge name={file.original_name ?? ''} size={38} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>Chỉnh sửa thông tin</div>
            <div style={{ fontSize:12, color:'#94a3b8', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {file.original_name ?? '—'}
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:9, border:'1px solid #e7ecf3', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Tên tài liệu */}
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#475569', marginBottom:7, textTransform:'uppercase', letterSpacing:.5 }}>
              Tên tài liệu
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nhập tên tài liệu..."
              style={{ width:'100%', height:42, border:'1px solid #e7ecf3', borderRadius:11, padding:'0 14px', fontFamily:'inherit', fontSize:13.5, color:'#334155', outline:'none', boxSizing:'border-box', transition:'border-color .15s' }}
              onFocus={e => (e.target.style.borderColor = '#93c5fd')}
              onBlur={e  => (e.target.style.borderColor = '#e7ecf3')}
            />
          </div>

          {/* Loại tài liệu */}
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#475569', marginBottom:7, textTransform:'uppercase', letterSpacing:.5 }}>
              Loại tài liệu
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value as IFileType)}
              style={{ width:'100%', height:42, border:'1px solid #e7ecf3', borderRadius:11, padding:'0 14px', fontFamily:'inherit', fontSize:13.5, color:'#334155', background:'#fff', outline:'none', cursor:'pointer', boxSizing:'border-box' }}
            >
              {FILE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Ẩn hiện */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:'#f8fafc', borderRadius:12, border:'1px solid #eef2f7' }}>
            <div>
              <div style={{ fontSize:13.5, fontWeight:600, color:'#334155' }}>Ẩn khỏi học sinh</div>
              <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>Học sinh sẽ không thấy tài liệu này</div>
            </div>
            <Toggle checked={isPrivate} onChange={setIsPrivate} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 22px', borderTop:'1px solid #f1f5f9', background:'#fbfcfe', justifyContent:'flex-end' }}>
          <button
            onClick={onClose}
            style={{ height:40, padding:'0 18px', borderRadius:10, border:'1px solid #e7ecf3', background:'#fff', color:'#475569', fontWeight:600, fontSize:13.5, fontFamily:'inherit', cursor:'pointer' }}
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="tdf-primary"
            style={{ height:40, fontSize:13.5 }}
          >
            {saving ? <><Spinner size={14} color="#fff" /> Đang lưu...</> : <><Save size={14} /> Lưu thay đổi</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditFileModal;
