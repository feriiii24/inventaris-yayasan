import AddAssetPage from './AddAssetPage'

interface Props {
  onBack: () => void
  initialValues?: Record<string, string | number>
  mode?: 'create' | 'edit'
}

export default function AssetBergerakForm({ onBack, initialValues, mode = 'create' }: Props) {
  return (
    <AddAssetPage
      onBack={onBack}
      initialValues={initialValues}
      mode={mode}
      category="Bergerak"
      title="Tambah Aset Bergerak"
      submitLabel="Simpan Aset Bergerak"
    />
  )
}
