import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'

type Message = { id: number; from: 'assistant' | 'user'; text: string }

const suggestions = ['Cara tambah aset?', 'Apa itu mutasi aset?', 'Bagaimana cek ruangan?']
const thinkingSteps = [
  'Memverifikasi pertanyaan',
  'Mencari sumber jawaban',
  'Menganalisis data inventaris',
  'Menyusun jawaban',
]

export default function AiChatWidget() {
  const [open, setOpen] = useState(false)
  const [panelVisible, setPanelVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [thinkingStep, setThinkingStep] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, from: 'assistant', text: 'Halo! Saya asisten Inventaris. Ada yang bisa saya bantu?' },
  ])

  useEffect(() => {
    if (open) {
      setPanelVisible(true)
      setClosing(false)
      return
    }

    if (!panelVisible) return

    setClosing(true)
    const timeout = window.setTimeout(() => {
      setPanelVisible(false)
      setClosing(false)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [open, panelVisible])

  useEffect(() => {
    if (!loading) {
      setThinkingStep(0)
      return
    }

    setThinkingStep(0)
    const interval = window.setInterval(() => {
      setThinkingStep((current) => Math.min(current + 1, thinkingSteps.length - 1))
    }, 1150)

    return () => window.clearInterval(interval)
  }, [loading])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading, thinkingStep])

  const togglePanel = () => {
    setOpen((value) => !value)
  }

  const sendMessage = async (text = input) => {
    const question = text.trim()
    if (!question || loading) return
    const previousAssistantMessage = [...messages]
      .reverse()
      .find((message) => message.from === 'assistant' && (/\[[^\]]+\]/.test(message.text) || /\b(Ruangan|Lokasi)\s+[A-Za-z0-9_-]+/i.test(message.text)))?.text ?? ''
    const context = previousAssistantMessage.length > 2000
      ? previousAssistantMessage.slice(-2000)
      : previousAssistantMessage
    setLoading(true)
    setMessages((current) => [
      ...current,
      { id: Date.now(), from: 'user', text: question },
    ])
    setInput('')
    try {
      const response = await fetch(`/ai-assistant?question=${encodeURIComponent(question)}&context=${encodeURIComponent(context)}`, {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error('AI request failed')
      const [data] = await Promise.all([
        response.json() as Promise<{ answer?: string }>,
        new Promise((resolve) => window.setTimeout(resolve, 4600)),
      ])
      setMessages((current) => [...current, {
        id: Date.now() + 1,
        from: 'assistant',
        text: data.answer ?? 'Jawaban tidak tersedia.',
      }])
    } catch {
      setMessages((current) => [...current, {
        id: Date.now() + 1,
        from: 'assistant',
        text: 'Data belum dapat diambil. Periksa koneksi lalu coba lagi.',
      }])
    } finally {
      setLoading(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 2147483000,
        pointerEvents: 'auto',
      }}
    >
      {panelVisible && (
        <div className={`ai-chat-panel mb-3 flex h-[min(560px,calc(100vh-6rem))] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.2)] ${closing ? 'ai-chat-panel-exit' : ''}`}>
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-700 to-teal-600 px-5 py-4 text-white">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100">Bantuan aplikasi</p>
              <h2 className="mt-1 font-bold">Asisten Inventaris</h2>
            </div>
            <button type="button" onClick={togglePanel} className="rounded-xl p-2 text-white/80 hover:bg-white/15 hover:text-white" aria-label="Tutup chat">×</button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-5 ${message.from === 'user' ? 'rounded-br-md bg-emerald-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'}`}>
                  {message.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start" aria-live="polite">
                <div className="ai-thinking-card rounded-2xl rounded-bl-md border border-emerald-100 bg-white px-4 py-3.5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-xs text-emerald-600">✦</span>
                    <span className="text-xs font-semibold text-slate-700">Menyiapkan jawaban</span>
                  </div>
                  <div className="space-y-2">
                    {thinkingSteps.map((step, index) => {
                      const complete = index < thinkingStep
                      const active = index === thinkingStep
                      return (
                        <div key={step} className={`flex items-center gap-2 text-xs ${active ? 'font-semibold text-emerald-700' : complete ? 'text-slate-500' : 'text-slate-300'}`}>
                          <span className={`ai-thinking-check flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] ${complete ? 'border-emerald-500 bg-emerald-500 text-white' : active ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-white'}`}>
                            {complete ? '✓' : active ? <span className="ai-thinking-dot" /> : ''}
                          </span>
                          <span>{step}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} aria-hidden="true" />
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => sendMessage(suggestion)} className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50">{suggestion}</button>
                ))}
              </div>
            )}
          </div>
          <form data-confirm-skip="true" onSubmit={(event) => { event.preventDefault(); void sendMessage() }} className="flex gap-2 border-t border-slate-200 bg-white p-3">
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Tulis pesan..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            <button type="submit" disabled={loading} className="rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60" aria-label="Kirim pesan">{loading ? 'Berpikir...' : 'Kirim'}</button>
          </form>
        </div>
      )}
      <button type="button" onClick={togglePanel} className="ml-auto flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(5,150,105,0.35)] transition hover:-translate-y-1 hover:bg-emerald-700" style={{ display: 'flex', visibility: 'visible', opacity: 1 }} aria-label={open ? 'Tutup asisten' : 'Buka asisten'}>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-base">{open ? '×' : '✦'}</span>
        <span className="hidden sm:inline">{open ? 'Tutup' : 'Bantuan AI'}</span>
      </button>
    </div>,
    document.documentElement,
  )
}
