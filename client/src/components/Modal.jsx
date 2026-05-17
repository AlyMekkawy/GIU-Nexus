// components/Modal.jsx
// Reusable confirmation/action modal with frosted overlay.
// Usage:
//   <Modal
//     isOpen={bool}
//     onClose={fn}
//     title="Delete?"
//     body={<p>Are you sure?</p>}
//     confirmLabel="Delete"
//     confirmClass="modal-btn-danger"
//     onConfirm={fn}
//     confirmLoading={bool}
//   />

import { useEffect } from "react";
import "./Modal.css";

function Modal({
  isOpen,
  onClose,
  title,
  body,
  confirmLabel = "Confirm",
  confirmClass = "modal-btn-primary",
  onConfirm,
  confirmLoading = false,
  icon = "warn",
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !confirmLoading) onClose();
    };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, confirmLoading]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={!confirmLoading ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>

        {/* Icon */}
        <div className={`modal-icon-wrap modal-icon-${icon}`} aria-hidden="true">
          {icon === "warn" ? (
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          )}
        </div>

        <h2 className="modal-title" id="modal-title">{title}</h2>

        <div className="modal-body">{body}</div>

        <div className="modal-actions">
          <button
            className="modal-btn modal-btn-cancel"
            onClick={onClose}
            disabled={confirmLoading}
          >
            Cancel
          </button>
          <button
            className={`modal-btn ${confirmClass}`}
            onClick={onConfirm}
            disabled={confirmLoading}
          >
            {confirmLoading ? (
              <span className="modal-spinner" aria-label="Loading" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default Modal;
