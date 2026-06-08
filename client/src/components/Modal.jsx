import { useEffect } from 'react';
import './Modal.css';

/*
  Props
  ─────
  isOpen          boolean
  onClose         () => void
  title           string
  body            ReactNode          — main content (alternative to children)
  children        ReactNode          — main content (alternative to body)

  onConfirm       () => void         — if provided, shows action buttons
  confirmLabel    string             — default "Confirm"
  confirmClass    string             — CSS class on confirm btn (e.g. "modal-btn-danger")
  confirmLoading  boolean            — shows spinner on confirm btn
  cancelLabel     string             — default "Cancel"

  icon            "warn"|"info"|"success"|"danger"  — coloured icon above title
*/
function Modal({
  isOpen,
  onClose,
  title,
  body,
  children,
  onConfirm,
  confirmLabel    = "Confirm",
  confirmClass    = "modal-btn-primary",
  confirmLoading  = false,
  cancelLabel     = "Cancel",
  icon,
}) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const ICON_MAP = {
    warn:    { symbol: 'warning',      cls: 'modal-icon-wrap modal-icon-warn'    },
    danger:  { symbol: 'delete',       cls: 'modal-icon-wrap modal-icon-danger'  },
    info:    { symbol: 'info',         cls: 'modal-icon-wrap modal-icon-info'    },
    success: { symbol: 'check_circle', cls: 'modal-icon-wrap modal-icon-success' },
  };

  const iconCfg = icon ? ICON_MAP[icon] : null;
  const content = body ?? children;

  return (
    <div className="modal-backdrop" onClick={() => { if (!confirmLoading) onClose(); }} data-cy="modal-backdrop">
      <div className="modal-box" onClick={e => e.stopPropagation()} data-cy="modal-box">

        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={confirmLoading}
            aria-label="Close"
            data-cy="modal-close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {iconCfg && (
            <div className={iconCfg.cls} aria-hidden="true">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {iconCfg.symbol}
              </span>
            </div>
          )}
          <div className="modal-content">{content}</div>
        </div>

        {/* Footer — only rendered when onConfirm is provided */}
        {onConfirm && (
          <div className="modal-footer">
            <button
              className="modal-btn modal-btn-cancel"
              onClick={onClose}
              disabled={confirmLoading}
              data-cy="modal-cancel"
            >
              {cancelLabel}
            </button>
            <button
              className={`modal-btn ${confirmClass}`}
              onClick={onConfirm}
              disabled={confirmLoading}
              data-cy="modal-confirm"
            >
              {confirmLoading
                ? <><span className="modal-spinner" />Working…</>
                : confirmLabel}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default Modal;
