import AddAssetPage from './AddAssetPage'

interface Props {
  onBack: () => void
  initialValues?: Record<string, string | number>
  mode?: 'create' | 'edit'
}

export default function AssetUsahaYayasanForm({ onBack, initialValues, mode = 'create' }: Props) {
  return (
    <AddAssetPage
      onBack={onBack}
      initialValues={initialValues}
      mode={mode}
      category="Usaha Yayasan"
      title="Tambah Usaha Yayasan"
      submitLabel="Simpan Usaha Yayasan"
    />
  )
}
