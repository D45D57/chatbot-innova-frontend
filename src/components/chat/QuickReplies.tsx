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
  const isHelpfulOption = (option: QuickReplyOption) =>
    option.action === 'HELPFUL_YES' || option.action === 'HELPFUL_NO'
  const helpfulOptions = options.filter(isHelpfulOption)
  const regularOptions = options.filter(option => !isHelpfulOption(option))

  const renderOption = (option: QuickReplyOption, compact = false) => {
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
          padding: compact ? '2px 8px' : '4px 12px',
          border: `${compact ? 1 : 1.5}px solid var(--color-primary)`,
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-bg)',
          color: 'var(--color-bg-answer)',
          fontSize: compact ? '11px' : '14px',
          fontWeight: compact ? 500 : 600,
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
  }

  return (
    <section style={{ width: '100%', marginTop: helpfulOptions.length > 0 ? '2px' : '6px', padding: '0 2px' }}>
      {helpfulOptions.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
          {helpfulOptions.map(option => renderOption(option, true))}
        </div>
      )}
      {regularOptions.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'flex-start',
          gap: '8px',
          marginTop: helpfulOptions.length > 0 ? '8px' : 0,
        }}>
          {regularOptions.map(option => renderOption(option))}
        </div>
      )}
    </section>
  )
}
