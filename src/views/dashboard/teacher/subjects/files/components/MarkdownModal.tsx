import { type FC, useEffect, useState } from 'react';
import { X, Send, Pencil, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { ISubjectFile } from '@/infra/api/interfaces/ITeacher';
import { md2html } from '../helpers';
import { Spinner } from './shared';

interface Props {
  maMon: string;
  file: ISubjectFile;
  onClose: () => void;
  onSubmit: (fileId: string, markdown: string) => void;
}

const MarkdownModal: FC<Props> = ({ maMon, file, onClose, onSubmit }) => {
  const [draft,  setDraft]  = useState('');
  const [loading, setLoad]  = useState(true);
  const [saving,  setSaving] = useState(false);

  useEffect(() => {
    TeacherApi.getFileMarkdown(maMon, file.id)
      .then(r => setDraft(r.data.markdown ?? ''))
      .catch(() => toast.error('Không thể tải markdown.'))
      .finally(() => setLoad(false));
  }, [maMon, file.id]);

  return (
    <div className="tdf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tdf-panel" style={{ width:'min(1280px,97vw)', height:'min(88vh,840px)', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:13, padding:'16px 22px', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
          <div style={{ width:38, height:38, borderRadius:11, background:'#eef2ff', color:'#4f46e5', display:'flex', alignItems:'center', justifyContent:'center' }}><Pencil size={18} /></div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file.original_name}</div>
            <div style={{ fontSize:12.5, color:'#94a3b8' }}>Chỉnh sửa Markdown · xem trước realtime trước khi gửi chatbot</div>
          </div>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:10, border:'1px solid #e7ecf3', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}><X size={16} /></button>
        </div>

        {/* Split pane */}
        {loading ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Spinner size={28} color="#4f46e5" />
          </div>
        ) : (
          <div style={{ flex:1, minHeight:0, display:'grid', gridTemplateColumns:'1fr 1fr' }}>
            {/* Editor */}
            <div style={{ display:'flex', flexDirection:'column', minHeight:0, borderRight:'1px solid #eef2f7' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', borderBottom:'1px solid #f1f5f9', background:'#fbfcfe', flexShrink:0 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#4f46e5' }} />
                <span style={{ fontSize:12, fontWeight:700, color:'#475569', letterSpacing:.3 }}>MARKDOWN GỐC</span>
                <span style={{ fontSize:11, color:'#b4becc', marginLeft:'auto' }}>{draft.split('\n').length} dòng · {draft.length} ký tự</span>
              </div>
              <textarea value={draft} onChange={e => setDraft(e.target.value)} spellCheck={false}
                style={{ flex:1, minHeight:0, border:'none', outline:'none', resize:'none', padding:'18px 20px', fontFamily:'monospace', fontSize:13, lineHeight:1.7, color:'#334155', background:'#fff' }} />
            </div>

            {/* Preview */}
            <div style={{ display:'flex', flexDirection:'column', minHeight:0, background:'#fcfdff' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', borderBottom:'1px solid #f1f5f9', background:'#fbfcfe', flexShrink:0 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#2563eb' }} />
                <span style={{ fontSize:12, fontWeight:700, color:'#475569', letterSpacing:.3 }}>XEM TRƯỚC</span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, color:'#16a34a', background:'#ecfdf3', padding:'2px 8px', borderRadius:999, marginLeft:'auto' }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:'#16a34a' }} /> Live
                </span>
              </div>
              <div style={{ flex:1, overflow:'auto', padding:'20px 24px' }}>
                <div className="tdf-md" dangerouslySetInnerHTML={{ __html: md2html(draft) }} />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 22px', borderTop:'1px solid #f1f5f9', background:'#fbfcfe', flexShrink:0 }}>
          <span style={{ fontSize:12, color:'#94a3b8' }}>Nội dung được gửi tới chatbot AI (RAG).</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ height:42, padding:'0 18px', borderRadius:11, border:'1px solid #e7ecf3', background:'#fff', color:'#475569', fontWeight:600, fontSize:13.5, fontFamily:'inherit', cursor:'pointer' }}>Đóng</button>
            <button onClick={() => { setSaving(true); onSubmit(file.id, draft); }} disabled={loading || !draft || saving}
              style={{ height:42, padding:'0 20px', borderRadius:11, border:'none', background:'linear-gradient(135deg,#4f46e5,#4338ca)', color:'#fff', fontWeight:700, fontSize:13.5, fontFamily:'inherit', display:'flex', alignItems:'center', gap:8, cursor:'pointer', boxShadow:'0 6px 16px rgba(79,70,229,.24)', opacity:(loading||!draft||saving) ? .5 : 1 }}>
              {saving ? <><Loader2 size={14} style={{ animation:'tdf-spin 1s linear infinite' }} /> Đang gửi...</> : <><Send size={14} /> Gửi sang chatbot</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownModal;
