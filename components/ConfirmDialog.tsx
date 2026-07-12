'use client';

import { useEffect, useId, useRef } from 'react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** If set, user must type this exact string to enable confirm */
  requireTypedText?: string;
  typedValue?: string;
  onTypedValueChange?: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'تأیید',
  cancelLabel = 'انصراف',
  danger = false,
  requireTypedText,
  typedValue = '',
  onTypedValueChange,
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmDialogProps) {
  const titleId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const canConfirm =
    !requireTypedText || typedValue.trim() === requireTypedText;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => confirmRef.current?.focus(), 50);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--brand)]/40 p-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-sm border border-[var(--border)] bg-[var(--surface-card)] p-5 shadow-lg"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-base font-bold text-[var(--text)]">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{message}</p>
        {requireTypedText ? (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
              برای تأیید، عبارت «{requireTypedText}» را وارد کنید
            </label>
            <input
              type="text"
              value={typedValue}
              onChange={(e) => onTypedValueChange?.(e.target.value)}
              className="app-input"
              dir="rtl"
              autoComplete="off"
            />
          </div>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="app-btn-secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={danger ? 'app-btn-danger-solid' : 'app-btn-primary'}
            onClick={onConfirm}
            disabled={busy || !canConfirm}
          >
            {busy ? 'در حال انجام…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
