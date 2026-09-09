import AddAssetPage from './AddAssetPage'

interface Props {
  onBack: () => void
  initialValues?: Record<string, string | number>
  mode?: 'create' | 'edit'
}

export default function AssetInventarisForm({ onBack, initialValues, mode = 'create' }: Props) {
  return (
    <AddAssetPage
      onBack={onBack}
      initialValues={initialValues}
      mode={mode}
      category="Inventaris"
      title="Tambah Aset Inventaris"
      submitLabel="Simpan Aset Inventaris"
    />
  )
}
