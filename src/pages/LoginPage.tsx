import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBusiness } from '../context/BusinessContext'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { brand } from '../styles/brand'
import { getStoredBusinesses } from '../services/businessStorage'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { loadBusiness } = useBusiness()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Completá todos los campos.')
      return
    }
    setLoading(true)
    try {
      const user = await login(email, password).then(() => {
        // Recargamos user del localStorage para obtener el id
        const stored = localStorage.getItem('eb_current_user')
        return stored ? JSON.parse(stored) : null
      })
      if (user) {
        loadBusiness(user.id)
        // Si ya tiene negocio → dashboard, si no → setup
        const hasBusiness = getStoredBusinesses().some(business => business.userId === user.id)
        navigate(hasBusiness ? '/dashboard' : '/configurar')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100svh',
      background: 'var(--color-bg)',
    }}>
      {/* Back button */}
      <div style={{ padding: '16px 24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '14px', color: 'var(--color-text-secondary)',
            border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-family)',
          }}
        >
          ← Crear cuenta
        </button>
      </div>

      <div style={{ flex: 1, padding: '8px 24px 40px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '6px' }}>
          Bienvenida de nuevo
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
          Ingresá a tu cuenta para continuar.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input
            label="Email"
            type="email"
            placeholder="Marina@gmail.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              error={error}
              endAdornment={(
                <PasswordVisibilityButton
                  visible={showPassword}
                  onClick={() => setShowPassword(v => !v)}
                />
              )}
            />
            <button
              type="button"
              style={{
                alignSelf: 'flex-end', fontSize: '13px',
                color: 'var(--color-primary)', border: 'none', background: 'none',
                cursor: 'pointer', fontFamily: 'var(--font-family)',
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <Button type="submit" fullWidth size="lg" loading={loading} style={{ background: brand.primaryGradient, borderRadius: 'var(--radius-md)', border: 'none' }}>
            INICIA SESIÓN
          </Button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
        }}>
          ¿No tenés cuenta?{' '}
          <Link to="/registro" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Crear cuenta.
          </Link>
        </p>
      </div>
    </div>
  )
}

function PasswordVisibilityButton({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      style={{
        width: '52px', height: '52px',
        display: 'grid', placeItems: 'center',
        border: 'none', background: 'transparent',
        color: 'var(--color-text-secondary)', cursor: 'pointer',
      }}
    >
      {visible ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m3 3 18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 9 4.5 10 8a13.7 13.7 0 0 1-2.1 4.2" />
          <path d="M6.6 6.6A13.6 13.6 0 0 0 2 12c1 3.5 5 8 10 8a10.7 10.7 0 0 0 5.4-1.5" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  )
}
