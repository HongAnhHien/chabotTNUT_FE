export const fmtSize = (b?: number | null): string => {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

export const fmtDate = (s?: string | null): string => {
  if (!s) return '';
  const d = new Date(s);
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
};

export const fmtRelative = (s?: string | null): string => {
  if (!s) return '';
  const diff = Date.now() - new Date(s).getTime();
  if (diff < 60000) return 'vừa xong';
  if (diff < 3600000) return `${Math.round(diff/60000)} phút trước`;
  if (diff < 86400000) return `${Math.round(diff/3600000)} giờ trước`;
  return `${Math.round(diff/86400000)} ngày trước`;
};

export const fmtNum = (n?: number | null): string =>
  n != null ? (n >= 1000 ? `${(n/1000).toFixed(1)}K` : `${n}`) : '—';

export const extOf = (name: string): string => name.split('.').pop()?.toLowerCase() ?? '';

export const isAiOk = (name: string): boolean => /\.(pdf|doc|docx)$/i.test(name);

export const iconBg = (name: string): { bg: string; color: string } => {
  const e = extOf(name);
  if (/^(jpg|jpeg|png|gif|webp|svg)$/.test(e)) return { bg:'rgba(8,145,178,.08)',   color:'#0891b2' };
  if (/^(mp4|mkv|avi|mov|webm)$/.test(e))       return { bg:'rgba(124,58,237,.08)', color:'#7c3aed' };
  if (/^(zip|rar|7z|tar|gz)$/.test(e))           return { bg:'rgba(217,119,6,.08)',  color:'#d97706' };
  if (/^(xls|xlsx|csv)$/.test(e))                return { bg:'rgba(5,150,105,.08)',  color:'#059669' };
  if (e === 'pdf')                                return { bg:'rgba(220,38,38,.08)',  color:'#dc2626' };
  if (/^(ppt|pptx)$/.test(e))                    return { bg:'rgba(234,88,12,.08)',  color:'#ea580c' };
  return { bg:'rgba(37,99,235,.07)', color:'#2563eb' };
};

export const previewType = (name: string): 'image' | 'video' | 'pdf' | 'docx' | 'xlsx' | 'none' => {
  const e = extOf(name);
  if (/^(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(e)) return 'image';
  if (/^(mp4|mkv|avi|mov|webm)$/.test(e))           return 'video';
  if (e === 'pdf')                                   return 'pdf';
  if (/^(doc|docx)$/.test(e))                        return 'docx';
  if (/^(xls|xlsx|csv)$/.test(e))                    return 'xlsx';
  return 'none';
};

// Download a URL that requires Bearer token by fetching as blob then triggering anchor click
export const downloadWithAuth = (url: string, filename: string, token: string): void => {
  fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.blob(); })
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 100);
    })
    .catch(() => {/* caller should show toast on failure */});
};

export const md2html = (raw: string): string => {
  let s = raw.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  s = s.replace(/```[\w]*\n([\s\S]*?)```/gm, (_,c) => `<pre><code>${c}</code></pre>`);
  s = s.replace(/^\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/gm, (_,head,body) => {
    const ths = head.split('|').filter(Boolean).map((h:string) => `<th>${h.trim()}</th>`).join('');
    const trs = (body||'').trim().split('\n').filter(Boolean).map((row:string) =>
      `<tr>${row.split('|').filter(Boolean).map((c:string) => `<td>${c.trim()}</td>`).join('')}</tr>`
    ).join('');
    return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  });
  s = s.replace(/^### (.+)$/gm,'<h3>$1</h3>').replace(/^## (.+)$/gm,'<h2>$1</h2>').replace(/^# (.+)$/gm,'<h1>$1</h1>');
  s = s.replace(/^---$/gm,'<hr>');
  s = s.replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>');
  s = s.replace(/`([^`\n]+)`/g,'<code>$1</code>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/^&gt; (.+)$/gm,'<blockquote>$1</blockquote>');
  s = s.replace(/((?:^\d+\. .+\n?)+)/gm, m => `<ol>${m.trim().split('\n').map(l=>`<li>${l.replace(/^\d+\. /,'')}</li>`).join('')}</ol>`);
  s = s.replace(/((?:^- .+\n?)+)/gm, m => `<ul>${m.trim().split('\n').map(l=>`<li>${l.slice(2)}</li>`).join('')}</ul>`);
  s = s.replace(/\n\n+/g,'</p><p>');
  if (s && !s.match(/^<(h[1-6]|ul|ol|table|pre|hr|blockquote)/)) s = '<p>' + s + '</p>';
  return s;
};
