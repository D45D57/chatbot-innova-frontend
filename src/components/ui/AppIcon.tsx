import type { ReactNode } from 'react'

export type AppIconName =
  | 'menu'
  | 'close'
  | 'bell'
  | 'dashboard'
  | 'business'
  | 'chat'
  | 'budget'
  | 'automation'
  | 'alert'
  | 'catalog'
  | 'faq'
  | 'settings'
  | 'edit'
  | 'trash'
  | 'check'
  | 'plus'
  | 'time'
  | 'agent'
  | 'metrics'
  | 'logout'
  | 'search'
  | 'chevronDown'
  | 'arrowLeft'

export function AppIcon({ name, size = 22, strokeWidth = 2 }: { name: AppIconName; size?: number; strokeWidth?: number }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth,
  }

  const paths: Record<AppIconName, ReactNode> = {
    menu: (
      <>
        <path {...common} d="M4 7h16" />
        <path {...common} d="M4 12h16" />
        <path {...common} d="M4 17h16" />
      </>
    ),
    arrowLeft: (
      <>
        <path {...common} d="m15 18-6-6 6-6" />
        <path {...common} d="M9 12h10" />
      </>
    ),
    close: (
      <>
        <path {...common} d="m6 6 12 12" />
        <path {...common} d="M18 6 6 18" />
      </>
    ),
    bell: (
      <>
        <path {...common} d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path {...common} d="M10 21h4" />
      </>
    ),
    dashboard: (
      <>
        <rect {...common} x="3" y="3" width="7" height="7" rx="1" />
        <rect {...common} x="14" y="3" width="7" height="7" rx="1" />
        <rect {...common} x="3" y="14" width="7" height="7" rx="1" />
        <rect {...common} x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    business: (
      <>
        <path {...common} d="M4 21V7l8-4 8 4v14" />
        <path {...common} d="M9 21v-7h6v7" />
        <path {...common} d="M8 9h.01" />
        <path {...common} d="M12 9h.01" />
        <path {...common} d="M16 9h.01" />
      </>
    ),
    chat: (
      <>
        <path {...common} d="M5 6h14v10H9l-4 4z" />
        <path {...common} d="M9 10h6" />
        <path {...common} d="M9 13h4" />
      </>
    ),
    budget: (
      <>
        <path {...common} d="M7 3h8l4 4v14H7z" />
        <path {...common} d="M15 3v5h5" />
        <path {...common} d="M12 17v-6" />
        <path {...common} d="M14.5 12.5A2.5 2.5 0 0 0 12 11a2 2 0 0 0 0 4 2 2 0 0 1 0 4 2.5 2.5 0 0 1-2.5-1.5" />
      </>
    ),
    automation: (
      <>
        <rect {...common} x="6" y="8" width="12" height="9" rx="3" />
        <path {...common} d="M9 8V6a3 3 0 0 1 6 0v2" />
        <path {...common} d="M9.5 12h.01" />
        <path {...common} d="M14.5 12h.01" />
        <path {...common} d="M10 15h4" />
        <path {...common} d="M4 12h2" />
        <path {...common} d="M18 12h2" />
      </>
    ),
    alert: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M12 7v6" />
        <path {...common} d="M12 17h.01" />
      </>
    ),
    catalog: (
      <>
        <path {...common} d="m12 3 8 4.5v9L12 21l-8-4.5v-9z" />
        <path {...common} d="m4 7.5 8 4.5 8-4.5" />
        <path {...common} d="M12 12v9" />
      </>
    ),
    faq: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M9.5 9a2.8 2.8 0 0 1 5 1.7c0 2.1-2.5 2.3-2.5 4" />
        <path {...common} d="M12 18h.01" />
      </>
    ),
    settings: (
      <>
        <path {...common} d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
        <path {...common} d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 0 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 0 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 0 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1a2 2 0 0 1 0 4H21a1.7 1.7 0 0 0-1.6 1" />
      </>
    ),
    edit: (
      <>
        <path {...common} d="M12 20h9" />
        <path {...common} d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </>
    ),
    trash: (
      <>
        <path {...common} d="M3 6h18" />
        <path {...common} d="M8 6V4h8v2" />
        <path {...common} d="M19 6l-1 14H6L5 6" />
        <path {...common} d="M10 11v5" />
        <path {...common} d="M14 11v5" />
      </>
    ),
    check: (
      <path {...common} d="m5 12 4 4L19 6" />
    ),
    plus: (
      <>
        <path {...common} d="M12 5v14" />
        <path {...common} d="M5 12h14" />
      </>
    ),
    time: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M12 7v5l3 3" />
      </>
    ),
    agent: (
      <>
        <circle {...common} cx="12" cy="8" r="3" />
        <path {...common} d="M5 20a7 7 0 0 1 14 0" />
        <path {...common} d="M15 13a4 4 0 0 1 4 4" />
        <path {...common} d="M9 13a4 4 0 0 0-4 4" />
      </>
    ),
    metrics: (
      <>
        <path {...common} d="M4 20V10" />
        <path {...common} d="M10 20V4" />
        <path {...common} d="M16 20v-7" />
        <path {...common} d="M22 20H2" />
      </>
    ),
    logout: (
      <>
        <path {...common} d="M10 17l5-5-5-5" />
        <path {...common} d="M15 12H3" />
        <path {...common} d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      </>
    ),
    search: (
      <>
        <circle {...common} cx="11" cy="11" r="7" />
        <path {...common} d="m20 20-4-4" />
      </>
    ),
    chevronDown: (
      <path {...common} d="m6 9 6 6 6-6" />
    ),
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block' }}>
      {paths[name]}
    </svg>
  )
}
