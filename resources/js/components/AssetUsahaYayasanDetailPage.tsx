import { AssetDetailTemplate } from './AssetDetailPage'

function getInfoRows(asset: Record<string, any>) {
  const documentName = asset.document_name ?? asset.document?.name ?? asset.metadata?.document?.name ?? ''

  return [
    { label: 'Kode Aset', value: String(asset.asset_code ?? asset.kode ?? '') },
    { label: 'Nama Aset', value: String(asset.name ?? asset.nama ?? asset.bentukUsaha ?? '') },
    { label: 'Kategori', value: String(asset.kategori ?? asset.category?.name ?? 'Usaha Yayasan') },
    { label: 'Jenis Aset', value: String(asset.jenis ?? asset.type?.name ?? '') },
    { label: 'Bentuk Usaha', value: String(asset.bentukUsaha ?? asset.name ?? '') },
    { label: 'Lokasi', value: String(asset.location?.name ?? asset.lokasi ?? '') },
    { label: 'Pengelola', value: String(asset.owner_name ?? asset.pengelola ?? '') },
    { label: 'Mulai Operasional', value: String(asset.start_operation_date ?? asset.mulaiOperasional ?? '') },
    { label: 'Dasar Perjanjian', value: String(asset.legal_basis ?? asset.dasarPerjanjian ?? '') },
    { label: 'Dokumen', value: documentName },
    { label: 'Kondisi', value: String(asset.condition_status ?? asset.kondisi ?? '') },
    { label: 'Nilai Perolehan', value: asset.purchase_value ?? asset.nilaiPerolehan ? `Rp ${Number(asset.purchase_value ?? asset.nilaiPerolehan).toLocaleString('id-ID')}` : '' },
    { label: 'Unit', value: String(asset.unit?.name ?? asset.unit_name ?? asset.unit ?? '') },
    { label: 'Penanggung Jawab', value: String(asset.owner_name ?? asset.penanggungjawab ?? '') },
    { label: 'Dibuat', value: String(asset.dibuat ?? asset.created_at ?? '') },
    { label: 'Keterangan', value: String(asset.description ?? asset.keterangan ?? '') },
  ].filter((row) => row.value)
}

interface Props {
  onBack: () => void
  assetId?: string
  asset?: Record<string, any>
}

export default function AssetUsahaYayasanDetailPage({ onBack, assetId, asset }: Props) {
  const resolvedAsset = asset ?? { id: assetId ?? '1', asset_code: '-', name: '-', kategori: 'Usaha Yayasan' }

  return <AssetDetailTemplate onBack={onBack} asset={resolvedAsset} title="Detail Usaha Yayasan" infoRows={getInfoRows(resolvedAsset)} />
}
