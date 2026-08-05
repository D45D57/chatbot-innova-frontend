import type { ReactNode } from 'react'

export function PublicChatBackground({ children }: { children: ReactNode }) {
  return (
    <main className="public-chat-page">
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
