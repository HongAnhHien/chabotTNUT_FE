import { type FC } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface Props {
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmModal: FC<Props> = ({
  title, body, confirmLabel = 'Xác nhận',
  danger = false, loading = false,
  onConfirm, onClose,
}) => (
  <div className="ex-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="ex-modal">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '20px 22px 16px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: danger ? '#fef2f2' : '#eff5ff',
          color: danger ? '#dc2626' : '#2563eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertTriangle size={19} />
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{title}</div>
          <div style={{ fontSize: 13.5, color: '#64748b', marginTop: 6, lineHeight: 1.55 }}>{body}</div>
        </div>
        <button
          onClick={onClose}
          style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e7ecf3', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0 }}
        >
          <X size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, padding: '14px 22px 20px', borderTop: '1px solid #f1f5f9' }}>
        <button
          onClick={onClose}
          disabled={loading}
          style={{ height: 40, padding: '0 18px', borderRadius: 10, border: '1px solid #e7ecf3', background: '#fff', color: '#475569', fontWeight: 600, fontSize: 13.5, fontFamily: 'inherit', cursor: 'pointer' }}
        >
          Hủy
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{
            height: 40, padding: '0 18px', borderRadius: 10, border: 'none',
            background: danger ? '#dc2626' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
            color: '#fff', fontWeight: 700, fontSize: 13.5, fontFamily: 'inherit',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1,
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}
        >
          {loading && <Loader2 size={14} style={{ animation: 'ex-spin 1s linear infinite' }} />}
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmModal;
