import { type FC, useEffect, useState } from 'react';
import { FileSearch, RefreshCw, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type {
  IParseLog,
  IParseLogsQuery,
  IParseLogsMeta,
  IParseLogStats,
  ParseLogService,
  ParseLogStatus,
} from '@/infra/api/interfaces/IParseLog';

const SERVICE_LABEL: Record<ParseLogService, string> = {
  llama: 'LlamaIndex',
  word:  'phpWord',
  excel: 'phpSpreadsheet',
};

const SERVICE_COLOR: Record<ParseLogService, string> = {
  llama: '#7c3aed',
  word:  '#2563eb',
  excel: '#0d9488',
};

const fmtDt = (iso?: string | null) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
};

const fmtDuration = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

const fmtSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
};

const rateColor = (rate: number) => rate >= 95 ? '#16a34a' : rate >= 80 ? '#d97706' : '#dc2626';

const CSS = `
  .pl-card { background:#fff;border:1px solid #e7ecf3;border-radius:16px; }
  .pl-stat { padding:16px 18px;display:flex;align-items:center;gap:14px; }
  .pl-badge { display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;padding:4px 10px;border-radius:8px; }
  .pl-input, .pl-select {
    height:38px;border:1px solid #e7ecf3;border-radius:10px;padding:0 11px;
    font-family:inherit;font-size:13px;color:#334155;outline:none;transition:border-color .15s;background:#fff;
  }
  .pl-input:focus, .pl-select:focus { border-color:#93c5fd; }
  .pl-row:hover { background:#f8fbff; }
  .pl-btn {
    height:38px;padding:0 14px;border-radius:10px;font-family:inherit;font-size:13px;font-weight:700;
    cursor:pointer;display:inline-flex;align-items:center;gap:7px;border:1px solid #e7ecf3;background:#fff;color:#475569;
    transition:background .13s;
  }
  .pl-btn:hover:not(:disabled) { background:#f8fafc; }
  .pl-btn:disabled { opacity:.5;cursor:not-allowed; }

  .pl-stats-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px; }
  .pl-split-grid { display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px; }
  .pl-table-scroll { overflow-x:auto; }
  .pl-filter-row { display:flex;gap:10px;flex-wrap:wrap; }

  @media(max-width:900px) {
    .pl-stats-grid { grid-template-columns:repeat(2,1fr); }
    .pl-split-grid { grid-template-columns:1fr; }
  }
  @media(max-width:640px) {
    .pl-stats-grid { grid-template-columns:1fr 1fr;gap:10px; }
    .pl-filter-row > * { flex:1 1 100%; }
  }
`;

const TeacherParseLogsPage: FC = () => {
  const [logs, setLogs]   = useState<IParseLog[]>([]);
  const [meta, setMeta]   = useState<IParseLogsMeta | null>(null);
  const [stats, setStats] = useState<IParseLogStats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const [status, setStatus]     = useState<ParseLogStatus | ''>('');
  const [service, setService]   = useState<ParseLogService | ''>('');
  const [maMon, setMaMon]       = useState('');
  const [filename, setFilename] = useState('');
  const [page, setPage]         = useState(1);
  const perPage = 50;

  useEffect(() => {
    TeacherApi.getParseLogStats()
      .then(res => setStats(res.data))
      .catch(() => toast.error('Không thể tải thống kê parse logs.'))
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    const query: IParseLogsQuery = {
      page, per_page: perPage,
      ...(status   ? { status }   : {}),
      ...(service  ? { service }  : {}),
      ...(maMon    ? { ma_mon: maMon }     : {}),
      ...(filename ? { filename }          : {}),
    };
    setLoading(true);
    const timer = setTimeout(() => {
      TeacherApi.getParseLogs(query)
        .then(res => { setLogs(res.data ?? []); setMeta(res.meta ?? null); })
        .catch(() => toast.error('Không thể tải danh sách log.'))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [status, service, maMon, filename, page]);

  const resetFilters = () => {
    setStatus(''); setService(''); setMaMon(''); setFilename(''); setPage(1);
  };

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(160deg,#eef4ff 0%,#e0eaff 40%,#f0f9ff 100%)', fontFamily: "'Be Vietnam Pro',system-ui,sans-serif" }}>
      <style>{CSS}</style>

      <div style={{ padding: '26px 32px 52px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSearch size={19} color="#7c3aed" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-.4px', color: '#0f172a' }}>Nhật ký xử lý tài liệu</h1>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#94a3b8' }}>Theo dõi các lần parse tài liệu (LlamaIndex, Word, Excel)</p>
          </div>
        </div>

        {/* ── Stats ─────────────────────────────────────── */}
        <div className="pl-stats-grid">
          <div className="pl-card pl-stat">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileSearch size={18} color="#2563eb" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{statsLoading ? '—' : stats?.total ?? 0}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Tổng số lần parse</div>
            </div>
          </div>
          <div className="pl-card pl-stat">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={18} color="#16a34a" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{statsLoading ? '—' : stats?.success ?? 0}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Thành công</div>
            </div>
          </div>
          <div className="pl-card pl-stat">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={18} color="#dc2626" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{statsLoading ? '—' : stats?.error ?? 0}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Lỗi</div>
            </div>
          </div>
          <div className="pl-card pl-stat">
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: statsLoading ? '#0f172a' : rateColor(stats?.success_rate ?? 0) }}>
                  {statsLoading ? '—' : `${stats?.success_rate ?? 0}%`}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Tỉ lệ thành công</div>
              <div style={{ height: 6, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(stats?.success_rate ?? 0, 100)}%`, background: rateColor(stats?.success_rate ?? 0), transition: 'width .3s' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── By service + recent errors ───────────────── */}
        {stats && (stats.by_service.length > 0 || stats.recent_errors.length > 0) && (
          <div className="pl-split-grid">
            <div className="pl-card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Theo dịch vụ</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stats.by_service.map(s => (
                  <div key={s.service} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="pl-badge" style={{ background: `${SERVICE_COLOR[s.service]}18`, color: SERVICE_COLOR[s.service], minWidth: 92, justifyContent: 'center' }}>
                      {SERVICE_LABEL[s.service] ?? s.service}
                    </span>
                    <span style={{ fontSize: 12.5, color: '#475569' }}>
                      {s.success}/{s.total} thành công · TB {fmtDuration(s.avg_duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pl-card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Lỗi gần đây</div>
              {stats.recent_errors.length === 0 ? (
                <div style={{ fontSize: 12.5, color: '#94a3b8' }}>Không có lỗi gần đây.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stats.recent_errors.map((e, i) => (
                    <div key={i} title={e.error} style={{ fontSize: 12.5, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 700, color: '#dc2626' }}>{e.ma_mon}</span> · {e.filename} — {e.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Filters ───────────────────────────────────── */}
        <div className="pl-card" style={{ padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select className="pl-select" value={status} onChange={e => { setStatus(e.target.value as ParseLogStatus | ''); setPage(1); }} style={{ flex: '0 0 140px' }}>
              <option value="">Tất cả trạng thái</option>
              <option value="success">Thành công</option>
              <option value="error">Lỗi</option>
            </select>
            <select className="pl-select" value={service} onChange={e => { setService(e.target.value as ParseLogService | ''); setPage(1); }} style={{ flex: '0 0 160px' }}>
              <option value="">Tất cả dịch vụ</option>
              <option value="llama">LlamaIndex</option>
              <option value="word">phpWord</option>
              <option value="excel">phpSpreadsheet</option>
            </select>
            <input className="pl-input" placeholder="Mã môn..." value={maMon} onChange={e => { setMaMon(e.target.value); setPage(1); }} style={{ flex: '0 0 140px' }} />
            <input className="pl-input" placeholder="Tên file..." value={filename} onChange={e => { setFilename(e.target.value); setPage(1); }} style={{ flex: '1 1 200px' }} />
            <button className="pl-btn" onClick={resetFilters} disabled={!status && !service && !maMon && !filename}>
              <RefreshCw size={13} /> Xóa lọc
            </button>
          </div>
        </div>

        {/* ── Table ─────────────────────────────────────── */}
        <div className="pl-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e7ecf3', background: '#f8fafc' }}>
                  {['#', 'Môn', 'File', 'Dịch vụ', 'Trạng thái', 'Thời gian', 'Ngày tạo', 'Chi tiết'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.03em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: '32px 14px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    <Clock size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Đang tải...
                  </td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: '32px 14px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Không có log nào phù hợp.</td></tr>
                ) : logs.map((log, i) => (
                  <tr key={log._id} className="pl-row" style={{ borderBottom: '1px solid #f1f5f9', transition: 'background .12s' }}>
                    <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#94a3b8' }}>{(page - 1) * perPage + i + 1}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{log.ma_mon}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#334155', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.filename}>
                      {log.filename}
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtSize(log.file_size)}</div>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span className="pl-badge" style={{ background: `${SERVICE_COLOR[log.service]}18`, color: SERVICE_COLOR[log.service] }}>
                        {SERVICE_LABEL[log.service] ?? log.service}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {log.status === 'success' ? (
                        <span className="pl-badge" style={{ background: '#f0fdf4', color: '#16a34a' }}><CheckCircle2 size={12} /> Thành công</span>
                      ) : (
                        <span className="pl-badge" style={{ background: '#fef2f2', color: '#dc2626' }}><AlertTriangle size={12} /> Lỗi</span>
                      )}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#475569' }}>{fmtDuration(log.duration_ms)}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#475569', whiteSpace: 'nowrap' }}>{fmtDt(log.created_at)}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12.5, color: log.status === 'error' ? '#dc2626' : '#64748b', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={log.status === 'error' ? (log.error ?? '') : (log.preview ?? '')}>
                      {log.status === 'error' ? (log.error ?? '—') : (log.preview ?? '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.last_page > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 12.5, color: '#94a3b8' }}>Trang {meta.current_page}/{meta.last_page} · Tổng {meta.total} bản ghi</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="pl-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</button>
                <button className="pl-btn" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Sau</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherParseLogsPage;
