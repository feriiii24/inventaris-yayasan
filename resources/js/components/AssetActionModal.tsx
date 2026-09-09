import { useEffect, useState } from 'react'

export interface AssetModalField {
  name: string
  label: string
  type?: 'text' | 'number' | 'date' | 'textarea' | 'select'
  options?: Array<{ label: string; value: string }>
}

interface AssetActionModalProps {
  open: boolean
  mode: 'create' | 'edit' | 'detail'
  title: string
  fields: AssetModalField[]
  initialValues?: Record<string, any>
  onClose: () => void
  onSave?: (values: Record<string, any>) => void
}

export default function AssetActionModal({
  open,
  mode,
  title,
  fields,
  initialValues = {},
  onClose,
  onSave,
}: AssetActionModalProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues)

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues, open])

  if (!open || mode === 'detail') return null

  const updateValue = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }))
  }

  const handleSave = () => {
    onSave?.(values)
  }

  const uniqueFieldOptions = (field: AssetModalField) => Array.from(new Map(
    (field.options ?? [])
      .map((option) => ({ value: String(option.value), label: option.label.trim() }))
      .filter((option) => option.label.length > 0)
      .map((option) => [option.label.toLocaleLowerCase(), option]),
  ).values())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
      <div className="w-full max-w-2xl rounded-2xl border bg-white shadow-2xl" style={{ borderColor: '#e2e8f0' }}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: '#e2e8f0' }}>
          <h3 className="text-base font-semibold" style={{ color: '#0f172a' }}>{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg border px-2 py-1 text-xs"
            style={{ borderColor: '#e2e8f0', color: '#475569' }}
          >
            Tutup
          </button>
        </div>

        <div className="p-5">
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => {
              const commonClass = 'w-full rounded-xl border px-3 py-2 text-sm outline-none'
              const sharedStyle = { borderColor: '#e2e8f0', background: '#ffffff', color: '#0f172a' }

              return (
                <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: '#475569' }}>
                    {field.label}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      value={String(values[field.name] ?? '')}
                      onChange={(e) => updateValue(field.name, e.target.value)}
                      className={commonClass}
                      style={sharedStyle}
                      rows={4}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={String(values[field.name] ?? '')}
                      onChange={(e) => updateValue(field.name, e.target.value)}
                      className={commonClass}
                      style={sharedStyle}
                    >
                      <option value="">Pilih...</option>
                      {uniqueFieldOptions(field).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type ?? 'text'}
                      value={String(values[field.name] ?? '')}
                      onChange={(e) => updateValue(field.name, e.target.value)}
                      className={commonClass}
                      style={sharedStyle}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-5 py-4" style={{ borderColor: '#e2e8f0' }}>
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl border text-xs font-medium"
            style={{ borderColor: '#e2e8f0', color: '#475569' }}
          >
            Batal
          </button>

          <button
            onClick={handleSave}
            className="px-3 py-2 rounded-xl text-xs font-medium text-white"
            style={{ background: '#166534' }}
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}
