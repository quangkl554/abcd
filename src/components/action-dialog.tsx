'use client';

import { type FormEvent, type ReactNode, useEffect } from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';

type ActionDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'warning' | 'danger';
  requireText?: string;
  inputLabel?: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export function ActionDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Hủy',
  tone = 'danger',
  requireText,
  inputLabel = 'Nhập xác nhận',
  inputValue = '',
  onInputChange,
  onCancel,
  onConfirm,
}: ActionDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel, open]);

  if (!open) return null;

  const confirmDisabled = requireText ? inputValue.trim() !== requireText : false;
  const confirmClass = tone === 'danger' ? 'red' : tone === 'warning' ? 'amber' : 'primary';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmDisabled) return;
    await onConfirm();
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <form className={`modal-panel action-modal ${tone}-modal`} role="dialog" aria-modal="true" aria-labelledby="action-dialog-title" onSubmit={submit}>
        <div className="modal-head action-modal-head">
          <div className="modal-title-row">
            <span className="modal-icon"><AlertTriangle size={18} /></span>
            <div>
              <h2 id="action-dialog-title">{title}</h2>
              <p>{description}</p>
            </div>
          </div>
          <button className="btn icon soft" type="button" onClick={onCancel} title="Đóng"><XCircle size={18} /></button>
        </div>

        {requireText ? (
          <label className="field confirm-field">
            {inputLabel}
            <input
              className="input confirm-input"
              value={inputValue}
              onChange={event => onInputChange?.(event.target.value)}
              placeholder={requireText}
              autoFocus
            />
          </label>
        ) : null}

        <div className="modal-actions">
          <button className="btn soft" type="button" onClick={onCancel}>{cancelLabel}</button>
          <button className={`btn ${confirmClass}`} type="submit" disabled={confirmDisabled}>{confirmLabel}</button>
        </div>
      </form>
    </div>
  );
}
