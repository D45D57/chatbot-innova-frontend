import { useState, type FormEvent } from 'react'
import type { CredentialResponse } from '@react-oauth/google'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBusiness } from '../context/BusinessContext'
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton'
import { AuthLayout, PasswordVisibilityButton } from '../components/auth/AuthLayout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { brand } from '../styles/brand'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, loginWithGoogle } = useAuth()
  const { loadBusiness } = useBusiness()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const continueAfterLogin = async (userId: string) => {
    const business = await loadBusiness(userId)
    navigate(business?.nombre ? '/dashboard' : '/configurar', { replace: true })
  }

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
        await continueAfterLogin(user.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async (response: CredentialResponse) => {
    setError('')
    if (!response.credential) {
      setError('Google no devolvió una credencial válida.')
      return
    }

    setGoogleLoading(true)
    try {
      const user = await loginWithGoogle(response.credential)
      await continueAfterLogin(user.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos continuar con Google.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Ingresá a tu cuenta para continuar."
      onBack={() => navigate('/')}
    >
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
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

          {error && (
            <p role="alert" style={{ margin: 0, color: 'var(--color-error)', fontSize: '13px', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading} disabled={googleLoading} style={{ background: brand.primaryGradient, borderRadius: 'var(--radius-md)', border: 'none' }}>
            INICIAR SESIÓN
          </Button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 0', color: 'var(--color-text-secondary)' }}>
          <span style={{ height: 1, flex: 1, background: 'var(--color-border)' }} />
          <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>o continuar con</span>
          <span style={{ height: 1, flex: 1, background: 'var(--color-border)' }} />
        </div>

        <div style={{ minHeight: 52 }}>
          <GoogleAuthButton
            onSuccess={handleGoogleLogin}
            onError={() => setError('No pudimos iniciar sesión con Google.')}
            disabled={loading || googleLoading}
          />
        </div>

        {googleLoading && (
          <p style={{ marginTop: '8px', color: 'var(--color-text-secondary)', fontSize: '12px', textAlign: 'center' }}>
            Verificando identidad con Google...
          </p>
        )}

        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
        }}>
          ¿No tenés cuenta?{' '}
          <Link to="/registro" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Crear cuenta
          </Link>
        </p>
    </AuthLayout>
  )
}
