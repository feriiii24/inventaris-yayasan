import { useRef, useState } from 'react'
import ConfirmDialog from './ConfirmDialog'

type ConfirmableFormProps = React.FormHTMLAttributes<HTMLFormElement> & {
  actionLabel?: string
  actionDescription?: string
}

export default function ConfirmableForm({
  actionLabel = 'Simpan',
  actionDescription = 'Apakah Anda yakin ingin menyimpan perubahan ini?',
  onSubmit,
  children,
  ...formProps
}: ConfirmableFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null)
  const allowSubmitRef = useRef(false)
  const [open, setOpen] = useState(false)

  return (
    <>
      <ConfirmDialog
        open={open}
        title={`${actionLabel} data`}
        message={actionDescription}
        confirmLabel={`Ya, ${actionLabel.toLowerCase()}`}
        cancelLabel="Batal"
        tone="info"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          allowSubmitRef.current = true
          setOpen(false)
          formRef.current?.requestSubmit()
        }}
      />
      <form
        {...formProps}
        ref={formRef}
        onSubmitCapture={(event) => {
          if (!allowSubmitRef.current) {
            event.preventDefault()
            setOpen(true)
          } else {
            allowSubmitRef.current = false
          }
        }}
        onSubmit={onSubmit}
      >
        {children}
      </form>
    </>
  )
}
