import type { ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  subtitle: string
  onBack: () => void
  children: ReactNode
  illustrationSrc?: string
  illustrationAlt?: string
  compact?: boolean
}

export function AuthLayout({
  title,
  subtitle,
  onBack,
  children,
  illustrationSrc,
  illustrationAlt = '',
  compact = false,
}: AuthLayoutProps) {
  return (
    <div className={`auth-layout${compact ? ' auth-layout--compact' : ''}`}>
      <div className="auth-layout__shell">
        <header className="auth-layout__brand">
          <img src="/isoBot-transparente.png" alt="" aria-hidden="true" />
          <span>EmprendeBot</span>
        </header>

        <button type="button" className="auth-layout__back" onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Volver
        </button>

        <main className={`auth-layout__main${illustrationSrc ? ' auth-layout__main--illustrated' : ''}`}>
          {illustrationSrc && (
            <div className="auth-layout__illustration" aria-hidden={illustrationAlt ? undefined : true}>
              <img src={illustrationSrc} alt={illustrationAlt} />
            </div>
          )}

          <section className="auth-layout__card" aria-labelledby="auth-title">
            <div className="auth-layout__heading">
              <h1 id="auth-title">{title}</h1>
              <p>{subtitle}</p>
            </div>
            {children}
          </section>
        </main>
      </div>

      <style>{`
        .auth-layout {
          --auth-background: #F8FAFB;
          --auth-foreground: #1A202C;
          --auth-card: #FFFFFF;
          --auth-muted: #E2E8F0;
          --auth-muted-foreground: #6C738E;
          --auth-accent: #E8F5F5;
          --auth-border: #E2E8F0;
          --auth-input: #FFFFFF;
          position: fixed;
          inset: 0;
          z-index: 10;
          container-type: inline-size;
          overflow: auto;
          color: var(--auth-foreground);
          background:
            linear-gradient(135deg, var(--auth-background) 0%, var(--auth-accent) 50%, var(--auth-background) 100%);
        }

        :root[data-theme='dark'] .auth-layout {
          --auth-background: #0F172A;
          --auth-foreground: #F8FAFC;
          --auth-card: #1E293B;
          --auth-muted: #334155;
          --auth-muted-foreground: #94A3B8;
          --auth-accent: #1E3A3A;
          --auth-border: #334155;
          --auth-input: #0F172A;
        }

        .auth-layout__shell {
          width: min(100%, 1600px);
          min-height: 100svh;
          margin: 0 auto;
          padding: 16px clamp(18px, 3vw, 48px) 40px;
          display: flex;
          flex-direction: column;
        }

        .auth-layout__brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 44px;
        }

        .auth-layout__brand img {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }

        .auth-layout__brand span {
          color: #13A8A2;
          font-size: 20px;
          font-weight: 800;
        }

        .auth-layout__back {
          width: fit-content;
          min-height: 44px;
          margin: 10px 0 4px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--auth-muted-foreground);
          font-size: 14px;
          border-radius: 10px;
          transition: color var(--transition), background-color var(--transition);
        }

        .auth-layout__back:hover {
          color: var(--auth-foreground);
        }

        .auth-layout__back:focus-visible {
          outline: 3px solid rgba(19, 168, 162, .28);
          outline-offset: 3px;
        }

        .auth-layout__back svg {
          width: 21px;
          height: 21px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .auth-layout__main {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 0 32px;
        }

        .auth-layout__main--illustrated {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(420px, .8fr);
          gap: clamp(48px, 7vw, 112px);
        }

        .auth-layout__illustration {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 0;
        }

        .auth-layout__illustration img {
          width: min(100%, 650px);
          max-height: 650px;
          object-fit: contain;
          filter: drop-shadow(0 28px 38px rgba(15, 23, 42, .16));
          animation: auth-illustration-float 4s ease-in-out infinite;
        }

        .auth-layout__card {
          width: min(100%, 480px);
          justify-self: end;
          padding: clamp(24px, 3vw, 32px);
          border: 1px solid var(--auth-border);
          border-radius: 24px;
          background: var(--auth-card);
          box-shadow: 0 24px 60px rgba(15, 23, 42, .16);
          animation: auth-card-enter .45s ease-out both;
        }

        .auth-layout__heading {
          margin-bottom: 24px;
        }

        .auth-layout__heading h1 {
          margin: 0 0 7px;
          color: var(--auth-foreground);
          font-size: clamp(28px, 3vw, 32px);
          line-height: 1.15;
          letter-spacing: -.6px;
        }

        .auth-layout__heading p {
          margin: 0;
          color: var(--auth-muted-foreground);
          font-size: 14px;
          line-height: 1.55;
        }

        .auth-layout input {
          background: var(--auth-input) !important;
          border-color: var(--auth-border) !important;
          border-radius: 12px !important;
          color: var(--auth-foreground) !important;
        }

        .auth-layout input:focus {
          border-color: #13A8A2 !important;
          box-shadow: 0 0 0 3px rgba(19, 168, 162, .16);
        }

        .auth-layout input::placeholder {
          color: var(--auth-muted-foreground);
          opacity: .72;
        }

        .auth-layout label {
          color: var(--auth-muted-foreground) !important;
        }

        .auth-layout .google-auth-button {
          --eb-border: var(--auth-border);
          --eb-card: var(--auth-background);
          --eb-muted: var(--auth-muted);
          --eb-foreground: var(--auth-foreground);
        }

        @keyframes auth-card-enter {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes auth-illustration-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        @container (max-width: 900px) {
          .auth-layout__main--illustrated {
            display: flex;
          }

          .auth-layout__illustration {
            display: none;
          }

          .auth-layout__card {
            justify-self: auto;
          }
        }

        @container (max-width: 520px) {
          .auth-layout__shell {
            padding: 12px 18px 28px;
          }

          .auth-layout__brand img {
            width: 36px;
            height: 36px;
          }

          .auth-layout__brand span {
            font-size: 18px;
          }

          .auth-layout__back {
            margin-top: 6px;
          }

          .auth-layout__main {
            align-items: flex-start;
            padding-top: 10px;
          }

          .auth-layout__card {
            padding: 24px 20px;
            border-radius: 20px;
            box-shadow: 0 16px 40px rgba(15, 23, 42, .12);
          }
        }

        .auth-layout--compact .auth-layout__main--illustrated {
          grid-template-columns: minmax(0, 1.1fr) minmax(380px, .9fr);
          gap: clamp(28px, 4vw, 64px);
          align-items: flex-start;
          padding-top: 4px;
        }

        .auth-layout--compact .auth-layout__illustration {
          align-items: flex-start;
          padding-top: 56px;
        }

        .auth-layout--compact .auth-layout__illustration img {
          width: min(100%, 440px);
          max-height: 480px;
        }

        .auth-layout--compact .auth-layout__card {
          width: min(100%, 500px);
          padding: clamp(20px, 2.5vw, 26px);
        }

        .auth-layout--compact .auth-layout__heading h1 {
          font-size: clamp(22px, 2.5vw, 26px);
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-layout__card,
          .auth-layout__illustration img {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}

export function PasswordVisibilityButton({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  const label = visible ? 'Ocultar contraseña' : 'Mostrar contraseña'

  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="auth-password-toggle">
      {visible ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m3 3 18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 9 4.5 10 8a13.7 13.7 0 0 1-2.1 4.2" />
          <path d="M6.6 6.6A13.6 13.6 0 0 0 2 12c1 3.5 5 8 10 8a10.7 10.7 0 0 0 5.4-1.5" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
      <style>{`
        .auth-password-toggle {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          color: var(--auth-muted-foreground, var(--color-text-secondary));
          border-radius: 10px;
        }
        .auth-password-toggle:hover { color: #13A8A2; }
        .auth-password-toggle:focus-visible {
          outline: 3px solid rgba(19, 168, 162, .25);
          outline-offset: -5px;
        }
        .auth-password-toggle svg {
          width: 20px;
          height: 20px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
        }
      `}</style>
    </button>
  )
}
