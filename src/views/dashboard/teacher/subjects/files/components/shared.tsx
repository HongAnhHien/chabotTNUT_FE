import { type FC } from 'react';
import { CheckCircle, Eye, Loader2, Image, Film, Archive, FileSpreadsheet, FileText } from 'lucide-react';
import { STATUS_CFG } from '../constants';
import { extOf, iconBg } from '../helpers';
import type { IFileExternalStatus } from '@/infra/api/interfaces/ITeacher';

// ── Status badge ──────────────────────────────────────────────
export const StatusBadge: FC<{ status: IFileExternalStatus }> = ({ status }) => {
  if (!status) return null;
  const c = STATUS_CFG[status];
  if (!c) return null;
  const spinning = status === 'pending' || status === 'processing' || status === 'sending';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11.5, fontWeight:600, padding:'3px 9px', borderRadius:999, background:c.bg, color:c.color, whiteSpace:'nowrap' }}>
      {spinning
        ? <Loader2 size={11} style={{ animation:'tdf-spin 1s linear infinite' }} />
        : status === 'success' ? <CheckCircle size={11} /> : status === 'parsed' ? <Eye size={11} /> : null}
      {c.label}
    </span>
  );
};

// ── File icon ─────────────────────────────────────────────────
export const FileIcon: FC<{ name: string; size?: number }> = ({ name, size = 16 }) => {
  const e = extOf(name);
  const { color } = iconBg(name);
  if (/^(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(e)) return <Image size={size} color={color} />;
  if (/^(mp4|mkv|avi|mov|webm)$/.test(e))           return <Film size={size} color={color} />;
  if (/^(zip|rar|7z|tar|gz)$/.test(e))               return <Archive size={size} color={color} />;
  if (/^(xls|xlsx|csv)$/.test(e))                    return <FileSpreadsheet size={size} color={color} />;
  return <FileText size={size} color={color} />;
};

// ── Ext badge (colored box with ext text) ─────────────────────
export const ExtBadge: FC<{ name: string; size?: number }> = ({ name, size = 40 }) => {
  const { bg, color } = iconBg(name);
  const ext = extOf(name).toUpperCase() || '?';
  return (
    <span style={{ width:size, height:size, borderRadius:Math.round(size*0.28), flexShrink:0, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:Math.round(size*0.27), fontWeight:800, background:bg, color }}>
      {ext}
    </span>
  );
};

// ── Toggle switch ─────────────────────────────────────────────
export const Toggle: FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <div onClick={() => onChange(!checked)} style={{ width:30, height:17, borderRadius:9, cursor:'pointer', transition:'background .2s', background:checked ? '#2563eb' : '#cbd5e1', position:'relative', flexShrink:0 }}>
    <div style={{ position:'absolute', top:2.5, left:checked ? 15 : 2.5, width:12, height:12, borderRadius:'50%', background:'white', transition:'left .18s', boxShadow:'0 1px 3px rgba(0,0,0,.22)' }} />
  </div>
);

// ── Spinner placeholder ───────────────────────────────────────
export const Spinner: FC<{ size?: number; color?: string }> = ({ size = 22, color = '#2563eb' }) => (
  <Loader2 size={size} color={color} style={{ animation:'tdf-spin 1s linear infinite' }} />
);

// ── Empty state ───────────────────────────────────────────────
export const EmptySlot: FC<{ text: string; onUpload?: () => void }> = ({ text, onUpload }) => (
  <div onClick={onUpload} style={{ border:'1.5px dashed #d7e0ec', borderRadius:12, padding:18, display:'flex', alignItems:'center', justifyContent:'center', gap:9, color:'#94a3b8', fontSize:13, cursor: onUpload ? 'pointer' : 'default', transition:'all .15s' }}
    onMouseEnter={e => { if (!onUpload) return; const el = e.currentTarget as HTMLDivElement; el.style.borderColor='#93c5fd'; el.style.color='#2563eb'; el.style.background='#f8fbff'; }}
    onMouseLeave={e => { if (!onUpload) return; const el = e.currentTarget as HTMLDivElement; el.style.borderColor='#d7e0ec'; el.style.color='#94a3b8'; el.style.background='transparent'; }}>
    {text}
  </div>
);
