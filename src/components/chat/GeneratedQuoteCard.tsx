import { useState } from 'react'
import type { GeneratedQuoteMessageData } from '../../types'
import { openQuoteDocument, shareQuoteDocument } from '../../utils/quoteDocumentActions'
import { getQuoteStatusLabel } from '../../utils/quoteStatus'

interface GeneratedQuoteCardProps {
  data: GeneratedQuoteMessageData
  businessName: string
}

function formatPrice(value?: number | null): string {
  if (value == null) return ''
  return '$' + value.toLocaleString('es-AR')
}

export function GeneratedQuoteCard({ data, businessName }: GeneratedQuoteCardProps) {
  const [documentError, setDocumentError] = useState<string | null>(null)
  const canShare = Boolean(data.pdfUrl && typeof navigator !== 'undefined' && navigator.share)

  const openPdf = () => {
    if (!data.pdfUrl) return
    const result = openQuoteDocument(data.pdfUrl)
    setDocumentError(
      result === 'blocked'
        ? 'No pudimos abrir el documento. Revisá que el navegador permita ventanas emergentes.'
        : result === 'invalid'
          ? 'El enlace del documento no es válido.'
          : null,
    )
  }

  const sharePdf = async () => {
    if (!data.pdfUrl) return
    const result = await shareQuoteDocument({
      url: data.pdfUrl,
      businessName,
      quoteNumber: data.number,
    })
    if (result === 'unsupported') openPdf()
  }

  const quoteNumber = data.number ?? (data.quoteId ? `P-${data.quoteId}` : undefined)

  return (
    <article className="chat-quote-card chat-quote-card--generated" aria-label="Presupuesto">
      <header className="chat-quote-card__header chat-quote-card__header--status">
        <div>
          <h3>Presupuesto</h3>
          {quoteNumber && <p>Nº {quoteNumber}</p>}
        </div>
        {data.status && (
          <span className={`chat-quote-status chat-quote-status--${data.status.toLowerCase()} chat-quote-status--highlight`}>
            {getQuoteStatusLabel(data.status)}
          </span>
        )}
      </header>

      <div className="chat-quote-card__body">
        {(data.customer?.name || data.customer?.phone) && (
          <div className="chat-quote-card__customer">
            {data.customer.name && <p className="chat-quote-card__customer-line">{data.customer.name}</p>}
            {data.customer.phone && <p className="chat-quote-card__customer-line">{data.customer.phone}</p>}
          </div>
        )}

        {data.items && data.items.length > 0 && (
          <ul className="chat-quote-card__items">
            {data.items.map((item, i) => {
              const lineTotal =
                item.unitPrice != null
                  ? item.unitPrice * item.quantity
                  : item.subtotal
              return (
                <li key={item.productId ?? i}>
                  <span>{item.quantity} × {item.name}</span>
                  {lineTotal != null ? (
                    <strong>{formatPrice(lineTotal)}</strong>
                  ) : (
                    <strong className="chat-quote-card__price-pending">A cotizar</strong>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {data.total != null && (
          <div className="chat-quote-card__total">
            <span>Total estimado</span>
            <strong>{formatPrice(data.total)}</strong>
          </div>
        )}

        {data.pdfUrl ? (
          <div className="chat-quote-card__actions chat-quote-card__actions--stacked">
            <button type="button" className="chat-quote-card__primary chat-quote-card__download-btn" onClick={openPdf}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 1v9m0 0L5 7m3 3 3-3M2 11v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Descargar PDF
            </button>
            {canShare && (
              <button type="button" className="chat-quote-card__secondary" onClick={() => void sharePdf()}>
                Compartir
              </button>
            )}
          </div>
        ) : (
          <p className="chat-quote-card__notice">
            El documento PDF todavía no está disponible.
          </p>
        )}

        {documentError && <p className="chat-quote-card__error" role="alert">{documentError}</p>}
      </div>
    </article>
  )
}
