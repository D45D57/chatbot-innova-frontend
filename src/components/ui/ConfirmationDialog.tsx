import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import '../../styles/confirmation-dialog.css'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  loading?: boolean
  disabled?: boolean
  closeOnEscape?: boolean
  closeOnOutsideClick?: boolean
  error?: string
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  loading = false,
  disabled = false,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  error = '',
}: ConfirmationDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const errorId = useId()
  const dialogRef = useRef<HTMLElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const isBlocked = loading || disabled

  useEffect(() => {
    if (!open) return

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusFrame = window.requestAnimationFrame(() => cancelButtonRef.current?.focus())

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.body.style.overflow = previousOverflow
      previouslyFocusedRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!isBlocked && closeOnEscape) {
          event.preventDefault()
          onOpenChange(false)
        }
        return
      }
      if (event.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) {
        event.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeOnEscape, isBlocked, onOpenChange, open])

  if (!open) return null

  return createPortal(
    <div
      className="confirmation-dialog__backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !isBlocked && closeOnOutsideClick) {
          onOpenChange(false)
        }
      }}
    >
      <section
        ref={dialogRef}
        className="confirmation-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : error ? errorId : undefined}
        aria-busy={loading}
      >
        <h2 id={titleId}>{title}</h2>
        {description && <div id={descriptionId} className="confirmation-dialog__description">{description}</div>}
        {error && <p id={errorId} className="confirmation-dialog__error" role="alert">{error}</p>}
        <div className="confirmation-dialog__actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="confirmation-dialog__cancel"
            disabled={isBlocked}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="confirmation-dialog__confirm"
            disabled={isBlocked}
            onClick={() => void onConfirm()}
          >
            <span className={loading ? 'confirmation-dialog__label is-loading' : 'confirmation-dialog__label'}>
              {confirmLabel}
            </span>
            {loading && <span className="confirmation-dialog__spinner" aria-label="Procesando" />}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  )
}
