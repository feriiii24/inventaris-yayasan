import { useEffect, useRef, useState } from 'react'

type AnimatedSelectProps = {
  value: string
  onChange: (value: string) => void
  options: (string | { value: string; label: string })[]
  placeholder?: string
  minWidth?: string
  className?: string
  searchPlaceholder?: string
  disabled?: boolean
}

export const normalizeOptionLabel = (label: string) => label.normalize('NFKC').trim().replace(/\s+/g, ' ')
export const optionLabelKey = (label: string) => normalizeOptionLabel(label).toLocaleLowerCase()

export default function AnimatedSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi',
  minWidth = '170px',
  className = '',
  searchPlaceholder = 'Cari data...',
  disabled = false,
}: AnimatedSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const safeValue = (value ?? '').trim()
  const placeholderKey = optionLabelKey(placeholder)
  const optionItems = options.map((option) => typeof option === 'string'
    ? { value: normalizeOptionLabel(option), label: normalizeOptionLabel(option) }
    : { value: String(option.value), label: normalizeOptionLabel(option.label) })
  const selectedItem = optionItems.find((option) => option.value.toLocaleLowerCase() === safeValue.toLocaleLowerCase())
  const uniqueOptions = Array.from(new Map(
    (selectedItem ? [selectedItem, ...optionItems] : optionItems)
      .filter((option) => option.label.length > 0 && optionLabelKey(option.label) !== placeholderKey)
      .map((option) => [optionLabelKey(option.label), option]),
  ).values())
  const selectedOption = uniqueOptions.find((option) => option.value === safeValue)
  const hasExactMatchInOptions = uniqueOptions.some((option) => option.value.toLocaleLowerCase() === safeValue.toLocaleLowerCase())
  const normalizedOptionItems = [
    ...(safeValue && !hasExactMatchInOptions && optionLabelKey(safeValue) !== placeholderKey
      ? [{ value: safeValue, label: safeValue }]
      : []),
    ...uniqueOptions,
  ]
  const normalizedOptions = Array.from(new Map(
    normalizedOptionItems.map((option) => [optionLabelKey(option.label), option]),
  ).values()).sort((a, b) => a.label.localeCompare(b.label))
  const filteredOptions = normalizedOptions.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase().trim()))
  const selectedLabel = selectedOption?.label ?? (safeValue.length > 0 ? safeValue : placeholder)
  const isPlaceholderSelected = safeValue.length === 0 || safeValue === placeholder
  const shouldRenderPlaceholderOption = !safeValue || (!hasExactMatchInOptions && safeValue !== placeholder) || (safeValue === placeholder && !hasExactMatchInOptions)

  return (
    <div ref={wrapperRef} className={`relative ${className}`} style={{ minWidth }}>
      <button
        type="button"
        onClick={() => {
          if (disabled) return
          setOpen((prev) => !prev)
          if (!open) setSearchTerm('')
        }}
        disabled={disabled}
        className={`flex h-10 w-full items-center justify-between rounded-xl border bg-white px-3 pr-8 text-left text-[13px] transition-all duration-200 ease-out ${disabled ? 'cursor-not-allowed opacity-70' : 'text-slate-700'}`}
        style={{
          borderColor: open ? '#166534' : '#e2e8f0',
          color: '#334155',
          boxShadow: open ? '0 0 0 3px rgba(22, 101, 52, 0.08)' : 'none',
          transform: open ? 'translateY(-1px)' : 'translateY(0)',
        }}
      >
        <span className="truncate">{selectedLabel}</span>
        <svg
          className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 ease-out"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: '#64748b' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border bg-white shadow-lg transition-all duration-200 ease-out"
        style={{
          borderColor: '#e2e8f0',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scaleY(1)' : 'translateY(-4px) scaleY(0.98)',
          transformOrigin: 'top center',
          maxHeight: open ? 'min(320px, 50vh)' : '0px',
          pointerEvents: open ? 'auto' : 'none',
          overflowY: open ? 'auto' : 'hidden',
          scrollbarWidth: 'thin',
        }}
      >
        <div className="border-b border-slate-200 bg-slate-50 px-2 py-2">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full border-0 bg-transparent text-[12px] text-slate-700 outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>
        </div>

        <div className="py-1">
          {shouldRenderPlaceholderOption && (
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
                setSearchTerm('')
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] transition-colors duration-150 hover:bg-slate-50"
              style={{
                color: isPlaceholderSelected ? '#166534' : '#475569',
                fontWeight: isPlaceholderSelected ? 600 : 400,
              }}
            >
              {placeholder}
            </button>
          )}

          {filteredOptions.length === 0 ? (
            <div className="px-3 py-3 text-[12px] text-slate-500">Tidak ada data yang cocok.</div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={`${option.value}-${option.label}`}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                  setSearchTerm('')
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] transition-colors duration-150 hover:bg-slate-50"
                style={{
                  color: safeValue === option.value ? '#166534' : '#475569',
                  fontWeight: safeValue === option.value ? 600 : 400,
                }}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
