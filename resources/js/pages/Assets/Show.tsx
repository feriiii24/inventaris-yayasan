import { router } from '@inertiajs/react'
import AssetBergerakDetailPage from '../../components/AssetBergerakDetailPage'
import AssetInventarisDetailPage from '../../components/AssetInventarisDetailPage'
import AssetTidakBergerakDetailPage from '../../components/AssetTidakBergerakDetailPage'
import AssetUsahaYayasanDetailPage from '../../components/AssetUsahaYayasanDetailPage'
import DashboardLayout from '../../Layouts/DashboardLayout'
import { getAssetIdFromPath } from '../../config/pageRoutes'
import type { Role } from '../../types'

export default function Show({ asset }: { asset?: Record<string, any> }) {
  const role: Role = 'super_admin'
  const assetId = getAssetIdFromPath() ?? asset?.id ?? '1'
  const resolvedAsset = asset ?? { id: assetId, kategori: 'Inventaris', asset_code: '#', name: 'Aset' }
  const slug = resolvedAsset.category?.slug ?? resolvedAsset.kategori?.toLowerCase?.() ?? 'inventaris'

  const renderDetailPage = () => {
    if (slug === 'bergerak' || resolvedAsset.kategori === 'Bergerak') {
      return <AssetBergerakDetailPage asset={resolvedAsset} onBack={() => router.visit('/inventaris/aset-bergerak')} assetId={assetId} />
    }

    if (slug === 'tidak-bergerak' || resolvedAsset.kategori === 'Tidak Bergerak') {
      return <AssetTidakBergerakDetailPage asset={resolvedAsset} onBack={() => router.visit('/inventaris/aset-tidak-bergerak')} assetId={assetId} />
    }

    if (slug === 'usaha-yayasan' || resolvedAsset.kategori === 'Usaha Yayasan') {
      return <AssetUsahaYayasanDetailPage asset={resolvedAsset} onBack={() => router.visit('/inventaris/usaha-yayasan')} assetId={assetId} />
    }

    return <AssetInventarisDetailPage asset={resolvedAsset} onBack={() => router.visit('/inventaris/aset-inventaris')} assetId={assetId} />
  }

  return (
    <DashboardLayout role={role} currentPage='asset-detail'>
      {renderDetailPage()}
    </DashboardLayout>
  )
}
