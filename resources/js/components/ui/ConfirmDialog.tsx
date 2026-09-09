import { createPortal } from 'react-dom'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  tone?: 'danger' | 'info'
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
  tone = 'danger',
}: ConfirmDialogProps) {
  if (!open) return null

  const accent = tone === 'danger' ? '#dc2626' : '#166534'
  const softBg = tone === 'danger' ? '#fef2f2' : '#ecfdf5'

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] isolate flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-[3px]" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" style={{ boxShadow: '0 24px 48px rgba(15, 23, 42, 0.28)' }}>
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: softBg, color: accent }}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86A2.07 2.07 0 0021 16.93V7.07A2.07 2.07 0 0018.93 5H5.07A2.07 2.07 0 003 7.07v9.86A2.07 2.07 0 005.07 19z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 id="confirm-dialog-title" className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5"
            style={{ borderColor: '#e2e8f0', color: '#475569', background: '#ffffff' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: accent }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
