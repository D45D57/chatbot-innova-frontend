import { useState } from 'react'
import type { FAQ } from '../../types'
import { Button } from '../ui/Button'
import { AppIcon } from '../ui/AppIcon'
import { brand } from '../../styles/brand'

interface FaqCardProps {
  faq: FAQ
  busy?: boolean
  onEdit: (faq: FAQ) => void
  onDelete: (faqId: string) => Promise<void>
  onToggle: (faqId: string) => Promise<void>
}

const FAQ_PRIMARY = brand.primary
const FAQ_TEXT = brand.text
const FAQ_MUTED = brand.muted
const FAQ_BORDER = brand.border
const FAQ_DANGER = brand.danger

export function FaqCard({
  faq,
  busy = false,
  onEdit,
  onDelete,
  onToggle,
}: FaqCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <article style={{
      padding: '14px 16px 12px',
      background: brand.surface,
      border: `1px solid ${FAQ_BORDER}`,
      borderRadius: '12px',
      boxShadow: brand.shadowCard,
      marginBottom: '10px',
      opacity: busy ? 0.7 : 1,
      transition: 'opacity var(--transition)',
    }}>
      <h2 style={{
        fontSize: '12px',
        fontWeight: 800,
        lineHeight: 1.35,
        marginBottom: '10px',
        color: FAQ_TEXT,
      }}>
        {faq.pregunta}
      </h2>

      {faq.categoria && (
        <p style={{
          fontSize: '11px',
          lineHeight: 1.45,
          marginBottom: '10px',
          color: FAQ_TEXT,
        }}>
          <strong style={{ fontWeight: 800 }}>Categoria:</strong>{' '}
          <span style={{ color: FAQ_MUTED, fontWeight: 500 }}>{faq.categoria}</span>
        </p>
      )}

      <p style={{
        color: FAQ_MUTED,
        fontSize: '11px',
        lineHeight: 1.45,
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        marginBottom: '12px',
      }}>
        {faq.respuesta}
      </p>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '10px',
      }}>
        <span style={{
          color: FAQ_MUTED,
          fontSize: '10px',
          lineHeight: 1.2,
          fontWeight: 600,
        }}>
          Mostrar en el chatbot
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={faq.activa}
          disabled={busy}
          aria-label={`${faq.activa ? 'Ocultar del chatbot' : 'Mostrar en el chatbot'}: ${faq.pregunta}`}
          onClick={() => void onToggle(faq.id)}
          style={{
            width: '42px',
            height: '24px',
            borderRadius: '999px',
            border: `2px solid ${faq.activa ? FAQ_PRIMARY : '#8A8391'}`,
            background: faq.activa ? 'rgba(19, 168, 162, 0.14)' : brand.surface,
            position: 'relative',
            padding: 0,
            cursor: busy ? 'not-allowed' : 'pointer',
            flexShrink: 0,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: faq.activa ? FAQ_PRIMARY : '#8A8391',
              position: 'absolute',
              top: '2px',
              left: faq.activa ? '20px' : '3px',
              transition: 'left var(--transition)',
            }}
          />
        </button>
      </div>

      {confirmingDelete ? (
        <div style={{
          marginTop: '10px',
          paddingTop: '12px',
          borderTop: `1px solid ${FAQ_BORDER}`,
        }}>
          <p style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', color: FAQ_TEXT }}>
            Seguro que queres eliminar esta FAQ?
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              disabled={busy}
              onClick={() => setConfirmingDelete(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              fullWidth
              loading={busy}
              onClick={() => void onDelete(faq.id)}
              style={{ background: FAQ_DANGER, borderColor: FAQ_DANGER }}
            >
              Eliminar
            </Button>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          gap: '22px',
          marginTop: '2px',
        }}>
          <button
            type="button"
            disabled={busy}
            onClick={() => onEdit(faq)}
            aria-label={`Editar ${faq.pregunta}`}
            style={{
              width: '24px',
              height: '24px',
              padding: 0,
              background: 'transparent',
              border: 'none',
              color: FAQ_MUTED,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.5 : 1,
            }}
          >
            <AppIcon name="edit" size={17} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmingDelete(true)}
            aria-label={`Eliminar ${faq.pregunta}`}
            style={{
              width: '24px',
              height: '24px',
              padding: 0,
              background: 'transparent',
              border: 'none',
              color: FAQ_DANGER,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.5 : 1,
            }}
          >
            <AppIcon name="trash" size={17} strokeWidth={1.8} />
          </button>
        </div>
      )}
    </article>
  )
}
