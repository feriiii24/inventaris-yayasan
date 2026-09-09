import { router } from '@inertiajs/react'
import AssetBergerakForm from '../../components/AssetBergerakForm'
import AssetInventarisForm from '../../components/AssetInventarisForm'
import AssetTidakBergerakForm from '../../components/AssetTidakBergerakForm'
import AssetUsahaYayasanForm from '../../components/AssetUsahaYayasanForm'
import DashboardLayout from '../../Layouts/DashboardLayout'
import type { Role } from '../../types'

export default function Create({ asset, category: categoryProp, mode }: { asset?: Record<string, any>; category?: string; mode?: 'create' | 'edit' }) {
  const role: Role = 'super_admin'
  const category = categoryProp ?? (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('category') : null)

  const renderForm = () => {
    switch (category) {
      case 'bergerak':
        return <AssetBergerakForm onBack={() => router.visit('/inventaris/aset-bergerak')} initialValues={asset} mode={mode ?? 'create'} />
      case 'tidak-bergerak':
        return <AssetTidakBergerakForm onBack={() => router.visit('/inventaris/aset-tidak-bergerak')} initialValues={asset} mode={mode ?? 'create'} />
      case 'usaha-yayasan':
        return <AssetUsahaYayasanForm onBack={() => router.visit('/inventaris/usaha-yayasan')} initialValues={asset} mode={mode ?? 'create'} />
      default:
        return <AssetInventarisForm onBack={() => router.visit('/inventaris/aset-inventaris')} initialValues={asset} mode={mode ?? 'create'} />
    }
  }

  return (
    <DashboardLayout role={role} currentPage='add-asset'>
      {renderForm()}
    </DashboardLayout>
  )
}
