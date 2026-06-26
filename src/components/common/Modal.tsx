import { type FC, type ReactNode, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, Loader2 } from 'lucide-react';

// ── Types ──────────────────────────────────────────────
export type ModalVariant = 'default' | 'info' | 'warning' | 'danger' | 'success';
export type ModalSize    = 'sm' | 'md' | 'lg';

export interface ModalButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;

  // Header
  title?: string;
  icon?: ReactNode;

  // Body
  children?: ReactNode;

  // Footer — either custom JSX or auto-generated from these props:
  footer?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** Called when cancel button is clicked. Defaults to onClose if not provided. */
  onCancel?: () => void;
  onConfirm?: () => void | Promise<void>;
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  /** Extra buttons rendered left of the confirm button */
  extraButtons?: ModalButton[];
  hideCancel?: boolean;
  hideFooter?: boolean;

  // Appearance
  variant?: ModalVariant;
  size?: ModalSize;

  // Behaviour
  /** Allow Escape key / backdrop click to close (default true) */
  closable?: boolean;
  /** Prevent backdrop click but still allow Escape (default false) */
  noBackdropClose?: boolean;
}

// ── Constants ──────────────────────────────────────────
const VARIANT: Record<ModalVariant, { accent: string; bg: string; defaultIcon: ReactNode }> = {
  default: { accent: '#0369a1', bg: 'rgba(3,105,161,0.08)',    defaultIcon: <Info      size={18} color="#0369a1" /> },
  info:    { accent: '#0369a1', bg: 'rgba(3,105,161,0.08)',    defaultIcon: <Info      size={18} color="#0369a1" /> },
  warning: { accent: '#d97706', bg: 'rgba(217,119,6,0.09)',    defaultIcon: <AlertTriangle size={18} color="#d97706" /> },
  danger:  { accent: '#dc2626', bg: 'rgba(220,38,38,0.08)',    defaultIcon: <AlertCircle   size={18} color="#dc2626" /> },
  success: { accent: '#059669', bg: 'rgba(5,150,105,0.08)',    defaultIcon: <CheckCircle   size={18} color="#059669" /> },
};

const SIZE_MAX: Record<ModalSize, number> = { sm: 360, md: 480, lg: 640 };

const BTN_ACCENT: Record<NonNullable<ModalButton['variant']>, string> = {
  primary:   '#0369a1',
  secondary: 'white',
  danger:    '#dc2626',
};

const CSS = `
  @keyframes _modal-bd  { from{opacity:0}             to{opacity:1} }
  @keyframes _modal-in  { from{opacity:0;transform:scale(.96) translateY(-6px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes _modal-spin{ to{transform:rotate(360deg)} }
  ._modal-bd  { animation: _modal-bd  .15s ease both }
  ._modal-box { animation: _modal-in  .2s cubic-bezier(.34,1.4,.64,1) both }
`;

// ── Component ──────────────────────────────────────────
const Modal: FC<ModalProps> = ({
  open,
  onClose,
  title,
  icon,
  children,
  footer,
  confirmText    = 'Xác nhận',
  cancelText     = 'Hủy',
  onCancel,
  onConfirm,
  confirmLoading = false,
  confirmDisabled= false,
  extraButtons,
  hideCancel     = false,
  hideFooter     = false,
  variant        = 'default',
  size           = 'md',
  closable       = true,
  noBackdropClose= false,
}) => {
  const vc = VARIANT[variant];

  // Escape key
  useEffect(() => {
    if (!open || !closable) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [open, closable, onClose]);

  if (!open) return null;

  const resolvedIcon = icon !== undefined ? icon : vc.defaultIcon;

  const handleBackdrop = () => {
    if (closable && !noBackdropClose) onClose();
  };

  return (
    <div className="_modal-bd"
      style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdrop}
    >
      <style>{CSS}</style>

      <div className="_modal-box"
        style={{ width: '100%', maxWidth: SIZE_MAX[size], background: 'white', borderRadius: 18, boxShadow: '0 28px 70px rgba(0,0,0,0.18)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{ padding: '16px 18px 14px', display: 'flex', alignItems: 'flex-start', gap: 12, borderBottom: '1px solid #f1f5f9' }}>
          {resolvedIcon && (
            <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: vc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {resolvedIcon}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0, paddingTop: resolvedIcon ? 7 : 0 }}>
            {title && (
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', lineHeight: 1.3 }}>{title}</div>
            )}
          </div>
          {closable && (
            <button onClick={onClose}
              style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 7, display: 'flex', lineHeight: 1 }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* ── Body ── */}
        {children != null && (
          <div style={{ padding: '14px 18px' }}>
            {children}
          </div>
        )}

        {/* ── Footer ── */}
        {!hideFooter && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            {footer ?? (
              <>
                {/* Extra custom buttons */}
                {extraButtons?.map((btn, i) => {
                  const isSecondary = btn.variant === 'secondary';
                  const accent = BTN_ACCENT[btn.variant ?? 'primary'];
                  return (
                    <button key={i} onClick={btn.onClick} disabled={btn.loading || btn.disabled}
                      style={{ padding: '8px 16px', borderRadius: 10, border: isSecondary ? '1px solid #e2e8f0' : 'none', background: isSecondary ? 'white' : accent, color: isSecondary ? '#475569' : 'white', fontSize: '0.8rem', fontWeight: 600, cursor: btn.loading || btn.disabled ? 'not-allowed' : 'pointer', opacity: btn.loading || btn.disabled ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      {btn.loading && <Loader2 size={12} style={{ animation: '_modal-spin 1s linear infinite' }} />}
                      {btn.label}
                    </button>
                  );
                })}

                {/* Cancel */}
                {!hideCancel && (
                  <button onClick={onCancel ?? onClose}
                    style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {cancelText}
                  </button>
                )}

                {/* Confirm */}
                {onConfirm && (
                  <button onClick={onConfirm} disabled={confirmLoading || confirmDisabled}
                    style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: confirmLoading || confirmDisabled ? '#94a3b8' : vc.accent, color: 'white', fontSize: '0.8rem', fontWeight: 700, cursor: confirmLoading || confirmDisabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {confirmLoading && <Loader2 size={13} style={{ animation: '_modal-spin 1s linear infinite' }} />}
                    {confirmText}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
