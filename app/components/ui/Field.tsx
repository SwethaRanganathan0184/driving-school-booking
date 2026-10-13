import { useId } from 'react'

const CONTROL =
  'w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-fg placeholder:text-muted/70 transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-50'

type FieldProps = {
  label: string
  hint?: string
  error?: string | null
  children: (props: { id: string; className: string; 'aria-invalid': boolean }) => React.ReactNode
}

/** Label + control + hint/error wrapper. The control is a render prop so inputs, selects and textareas share it. */
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-fg mb-1.5">
        {label}
      </label>
      {children({ id, className: `${CONTROL} ${error ? 'border-danger' : ''}`, 'aria-invalid': !!error })}
      {error ? (
        <p className="text-xs text-danger mt-1.5" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted mt-1.5">{hint}</p>
      ) : null}
    </div>
  )
}

export function Input({ label, hint, error, ...props }: { label: string; hint?: string; error?: string | null } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <Field label={label} hint={hint} error={error}>{(p) => <input {...p} {...props} />}</Field>
}

export function Textarea({ label, hint, error, ...props }: { label: string; hint?: string; error?: string | null } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <Field label={label} hint={hint} error={error}>{(p) => <textarea rows={4} {...p} {...props} />}</Field>
}
