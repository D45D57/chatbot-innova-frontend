import type { QuoteSummaryMessageData } from '../../types'

interface QuoteSummaryCardProps {
  data: QuoteSummaryMessageData
  onContinue: () => void
  onCancel: () => void
  isSubmitting: boolean
  isSubmitted: boolean
  isCancelled: boolean
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(value)

export function QuoteSummaryCard({ data, onContinue, onCancel, isSubmitting, isSubmitted, isCancelled }: QuoteSummaryCardProps) {
  const fixedItems = data.items.filter(item => !item.requiresQuote)
  const quoteItems = data.items.filter(item => item.requiresQuote)

  return (
    <article className="chat-quote-card" aria-label="Resumen del pedido">
      <header className="chat-quote-card__header">
        <h3>Resumen del pedido</h3>
      </header>

      <div className="chat-quote-card__body">
        {fixedItems.length > 0 && (
          <section>
            <h4>Productos con precio</h4>
            <ul className="chat-quote-card__items">
              {fixedItems.map(item => (
                <li key={item.productId}>
                  <span>{item.quantity} × {item.name}</span>
                  <strong>{item.subtotal != null ? formatCurrency(item.subtotal) : 'Precio no disponible'}</strong>
                </li>
              ))}
            </ul>
          </section>
        )}

        {quoteItems.length > 0 && (
          <section>
            <h4>Productos a cotizar</h4>
            <ul className="chat-quote-card__quote-items">
              {quoteItems.map(item => (
                <li key={item.productId}>
                  <span>{item.quantity > 0 ? `${item.quantity} × ` : ''}{item.name}</span>
                  <strong>A cotizar</strong>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="chat-quote-card__total">
          <span>Subtotal estimado</span>
          <strong>{formatCurrency(data.subtotal)}</strong>
        </div>

        {quoteItems.length > 0 && (
          <p className="chat-quote-card__notice">
            Los productos a cotizar no están incluidos en este subtotal. El importe final será
            confirmado por el negocio.
          </p>
        )}

        {!isCancelled && (
          <div className="chat-quote-card__actions chat-quote-card__actions--stacked">
            <button
              type="button"
              className="chat-quote-card__primary"
              onClick={onContinue}
              disabled={isSubmitting || isSubmitted}
              aria-busy={isSubmitting}
            >
              {isSubmitting
                ? 'Registrando solicitud…'
                : isSubmitted
                  ? 'Solicitud registrada'
                  : 'Solicitar presupuesto'}
            </button>
            {!isSubmitted && (
              <button type="button" className="chat-quote-card__secondary" onClick={onCancel} disabled={isSubmitting}>
                Cancelar presupuesto
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
