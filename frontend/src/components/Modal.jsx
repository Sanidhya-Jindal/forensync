export function Modal({ open, title, children, footer, onClose, className = '' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
      <div className={`w-full max-w-2xl rounded-lg border border-slate-700 bg-slate-900 shadow-soft ${className}`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-white">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-slate-400 transition hover:bg-slate-800 hover:text-white">
            Close
          </button>
        </div>
        <div className="px-5 py-5 text-sm text-slate-200">{children}</div>
        {footer ? <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, description, onCancel, onConfirm, confirmLabel = 'Confirm' }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={(
        <>
          <button type="button" onClick={onCancel} className="rounded-md border border-slate-700 px-4 py-2 text-slate-200 transition hover:bg-slate-800">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="rounded-md bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-500">
            {confirmLabel}
          </button>
        </>
      )}
    >
      <p className="leading-6 text-slate-300">{description}</p>
    </Modal>
  );
}
