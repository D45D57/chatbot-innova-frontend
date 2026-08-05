import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'

interface GoogleAuthButtonProps {
  onSuccess: (response: CredentialResponse) => void
  onError: () => void
  disabled?: boolean
}

export function GoogleAuthButton({ onSuccess, onError, disabled = false }: GoogleAuthButtonProps) {
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return <p role="alert" className="google-auth-button__error">Falta configurar VITE_GOOGLE_CLIENT_ID.</p>
  }

  return (
    <div
      className={`google-auth-button${disabled ? ' google-auth-button--disabled' : ''}`}
      aria-disabled={disabled}
    >
      <div className="google-auth-button__visual" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z" />
          <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.38l-3.24-2.53c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.05v2.61A10 10 0 0 0 12 22Z" />
          <path fill="#FBBC05" d="M6.4 13.92A6 6 0 0 1 6.08 12c0-.67.12-1.32.32-1.92V7.47H3.05A10 10 0 0 0 2 12c0 1.62.39 3.15 1.05 4.53l3.35-2.61Z" />
          <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.86-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.95 5.47l3.35 2.61c.79-2.37 3-4.13 5.6-4.13Z" />
        </svg>
        <span>Continuar con Google</span>
      </div>
      <div className="google-auth-button__official">
        <GoogleLogin onSuccess={onSuccess} onError={onError} text="continue_with" shape="rectangular" size="large" width="400" />
      </div>

      <style>{`
        .google-auth-button {
          position: relative;
          width: 100%;
          height: 52px;
          overflow: hidden;
          border: 2px solid var(--eb-border, var(--color-border));
          border-radius: 16px;
          background: var(--eb-card, var(--color-field));
          transition: border-color var(--transition), background-color var(--transition), transform var(--transition);
        }
        .google-auth-button:hover {
          border-color: #13A8A2;
          background: var(--eb-muted, var(--color-surface-muted));
        }
        .google-auth-button:active { transform: scale(.985); }
        .google-auth-button--disabled {
          opacity: .5;
          pointer-events: none;
          cursor: not-allowed;
        }
        .google-auth-button__visual {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--eb-foreground, var(--color-text-primary));
          font-size: 14px;
          font-weight: 600;
        }
        .google-auth-button__visual svg { width: 20px; height: 20px; flex: 0 0 auto; }
        .google-auth-button__official {
          position: absolute;
          inset: 0;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: .001;
          overflow: hidden;
        }
        .google-auth-button__official > div { transform: scale(1.18); }
        .google-auth-button__error {
          margin: 0;
          color: var(--color-error);
          text-align: center;
          font-size: 12px;
        }
      `}</style>
    </div>
  )
}
