interface ConnectionNoticeProps {
  isRetrying: boolean
  retryStatus?: 'offline' | 'server' | null
  onRetry: () => void
}

export function ConnectionNotice({ isRetrying, retryStatus = null, onRetry }: ConnectionNoticeProps) {
  const message = isRetrying
    ? 'Verificando conexión…'
    : retryStatus === 'offline'
      ? 'Seguís sin conexión. Revisá tu internet e intentá nuevamente.'
      : retryStatus === 'server'
        ? 'No pudimos verificar la conexión. Intentá nuevamente.'
        : 'No pudimos comunicarnos con el servidor. Revisá tu conexión a internet e intentá nuevamente.'

  return (
    <section className="public-chat__connection" role="status" aria-live="polite" aria-busy={isRetrying}>
      <span className="public-chat__connection-icon" aria-hidden="true">!</span>
      <div>
        <strong>Sin conexión</strong>
        <p>{message}</p>
      </div>
      <button type="button" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? 'Verificando…' : 'Reintentar'}
      </button>
    </section>
  )
}
