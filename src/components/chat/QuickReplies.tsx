import type { QuickReplyAction, QuickReplyOption } from '../../types'
import { AppIcon } from '../ui/AppIcon'

interface QuickRepliesProps {
  options: QuickReplyOption[]
  onSelect: (option: QuickReplyOption) => void
}

const ICON_MAP: Partial<Record<QuickReplyAction, 'catalog' | 'time' | 'faq' | 'agent'>> = {
  SHOW_CATALOG: 'catalog',
  SHOW_SCHEDULE: 'time',
  SHOW_FAQ_MENU: 'faq',
  START_HUMAN_HANDOFF: 'agent',
}

export function QuickReplies({ options, onSelect }: QuickRepliesProps) {
  if (options.length === 0) return null

  return (
    <section style={{ width: '100%', marginTop: '6px', padding: '0 2px' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        {options.map(option => {
          const icon = ICON_MAP[option.action]
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                border: '1.5px solid var(--color-primary)',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-bg)',
                color: 'var(--color-bg-answer)',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'var(--font-family)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 3px rgba(17,27,39,0.05)',
              }}
            >
              {icon && <AppIcon name={icon} size={16} />}
              {option.action === 'SHOW_MAIN_MENU' && <AppIcon name="arrowLeft" size={16} />}
              {option.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}
