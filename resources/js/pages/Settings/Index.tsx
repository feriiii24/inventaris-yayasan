import { useState, useMemo } from 'react'
import SidebarPage from '../../components/SidebarPage'

interface SettingItem {
  id: string
  title: string
  description: string
  category: string
  enabled: boolean
  icon?: string
}

const settings: SettingItem[] = [
  { id: 'notif-aset', title: 'Notifikasi Aset', description: 'Kirim pemberitahuan saat aset masuk, keluar, atau rusak', category: 'Notifikasi', enabled: true, icon: 'notification' },
  { id: 'audit-log', title: 'Audit Log', description: 'Catat semua perubahan data aset dan pengguna', category: 'Keamanan', enabled: true, icon: 'audit' },
  { id: 'backup-auto', title: 'Backup Otomatis', description: 'Cadangkan data aset setiap hari pukul 01.00', category: 'Sistem', enabled: true, icon: 'backup' },
  { id: 'approval-pinjam', title: 'Persetujuan Peminjaman', description: 'Wajib persetujuan admin sebelum pinjam dilakukan', category: 'Peraturan', enabled: false, icon: 'approval' },
]

const categoryIcons: Record<string, { bg: string; accent: string }> = {
  Notifikasi: { bg: 'from-emerald-500 to-teal-500', accent: '#059669' },
  Keamanan: { bg: 'from-blue-500 to-cyan-500', accent: '#0284c7' },
  Sistem: { bg: 'from-purple-500 to-violet-500', accent: '#7c3aed' },
  Peraturan: { bg: 'from-orange-500 to-red-500', accent: '#ea580c' },
}

export default function SettingsPage() {
  const [settingsList, setSettingsList] = useState<SettingItem[]>(settings)

  const toggleSetting = (id: string) => {
    setSettingsList(settingsList.map(item =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    ))
  }

  const stats = useMemo(() => ({
    total: settingsList.length,
    enabled: settingsList.filter(s => s.enabled).length,
  }), [settingsList])

  const categorizedSettings = useMemo(() => {
    const grouped: Record<string, SettingItem[]> = {}
    settingsList.forEach(setting => {
      if (!grouped[setting.category]) {
        grouped[setting.category] = []
      }
      grouped[setting.category].push(setting)
    })
    return grouped
  }, [settingsList])

  const getIcon = (type: string | undefined) => {
    switch(type) {
      case 'notification':
        return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
      case 'audit':
        return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
      case 'backup':
        return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>
      case 'approval':
        return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      default:
        return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
    }
  }

  return (
    <SidebarPage title="Pengaturan" subtitle="Atur preferensi sistem" currentPage='pengaturan'>
      <div className="space-y-6">
        <div className="relative rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 px-6 py-12 text-white shadow-[0_18px_40px_rgba(16,185,129,0.2)] sm:px-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-bold leading-tight">Pengaturan Sistem</h1>
                  <p className="mt-2 text-emerald-100">Konfigurasi dan preferensi aplikasi</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            { label: 'Total Pengaturan', value: stats.total, icon: 'settings', accent: 'from-emerald-500 to-teal-500' },
            { label: 'Aktif', value: stats.enabled, icon: 'check', accent: 'from-green-500 to-emerald-500' },
          ].map((stat, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              style={{ animation: `fadeInUp 0.5s ease-out ${index * 100}ms backwards` }}
            >
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${stat.accent}`} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.accent} text-white opacity-90`}>
                  {stat.icon === 'settings' && <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>}
                  {stat.icon === 'check' && <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        <div className="space-y-6">
          {Object.entries(categorizedSettings).map(([category, items], catIndex) => (
            <div
              key={category}
              className="space-y-3"
              style={{ animation: `fadeInUp 0.5s ease-out ${(catIndex + 2) * 100}ms backwards` }}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${categoryIcons[category]?.bg || 'from-slate-400 to-slate-500'} text-white`}>
                  {category === 'Notifikasi' && <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
                  {category === 'Keamanan' && <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
                  {category === 'Sistem' && <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>}
                  {category === 'Peraturan' && <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                </div>
                <h2 className="text-lg font-bold text-slate-900">{category}</h2>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                  {items.length}
                </span>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-emerald-300 hover:shadow-md"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 transition-opacity group-hover:opacity-100" />
                    
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-slate-700`}>
                            {getIcon(item.icon)}
                          </div>
                          <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                        </div>
                        <p className="mt-2 text-xs text-slate-600">{item.description}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSetting(item.id)}
                        className="relative h-6 w-11 flex-shrink-0 rounded-full transition-all duration-300"
                        style={{
                          background: item.enabled ? '#059669' : '#cbd5e1',
                        }}
                      >
                        <span
                          className="absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-300"
                          style={{ left: item.enabled ? '22px' : '4px' }}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SidebarPage>
  )
}
