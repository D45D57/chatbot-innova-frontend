import type { ReactNode } from 'react'

type PublicChatBackgroundVariant = 'dark' | 'light'

interface PublicChatBackgroundProps {
  children: ReactNode
  variant: PublicChatBackgroundVariant
}

export function PublicChatBackground({ children, variant }: PublicChatBackgroundProps) {
  return (
    <main className={`public-chat-page public-chat-background--${variant}`}>
      <header className="public-chat-page__brand" aria-label="EmprendeBot">
        <img src="/isoBot-transparente.png" alt="" aria-hidden="true" />
        <span>EmprendeBot</span>
      </header>

      <div className="public-chat-page__illustration" aria-hidden="true">
        <img src="/ayudar.png" alt="" />
      </div>

      {children}
    </main>
  )
}
