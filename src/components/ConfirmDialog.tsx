import { useEffect, useRef } from 'react';

export interface ConfirmDialogProps {
  open: boolean;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, message, confirmLabel = 'Confirm', onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-message">
        <p id="confirm-dialog-message">{message}</p>
        <div className="dialog-actions">
          <button type="button" className="secondary-button" ref={cancelRef} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="danger-button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
