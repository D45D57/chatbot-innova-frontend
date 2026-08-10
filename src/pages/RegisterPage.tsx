import { useState, type FormEvent } from 'react'
import type { CredentialResponse } from '@react-oauth/google'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBusiness } from '../context/BusinessContext'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { AuthLayout, PasswordVisibilityButton } from '../components/auth/AuthLayout'
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton'
import { brand } from '../styles/brand'
import { getUserFacingErrorMessage } from '../services/apiClient'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register, loginWithGoogle } = useAuth()
  const { loadBusiness } = useBusiness()

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!nombre || !email || !password || !confirmPassword) {
      setError('Completá todos los campos.')
      return
    }
    const passwordErrors: string[] = []
    if (password.length < 8) passwordErrors.push('mínimo 8 caracteres')
    if (!/[A-Z]/.test(password)) passwordErrors.push('una mayúscula')
    if (!/[a-z]/.test(password)) passwordErrors.push('una minúscula')
    if (!/[0-9]/.test(password)) passwordErrors.push('un número')
    if (!/[^A-Za-z0-9]/.test(password)) passwordErrors.push('un símbolo (@, $, !, %, *, ?, &...)')
    if (/\s/.test(password)) passwordErrors.push('sin espacios')
    if (passwordErrors.length > 0) {
      setError('La contraseña necesita: ' + passwordErrors.join(', ') + '.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    try {
      await register(nombre, email, password, '')
      setShowSuccessModal(true)
    } catch (err) {
      setError(getUserFacingErrorMessage(err, { context: 'register', fallback: 'No pudimos crear la cuenta. Intentá nuevamente.' }))
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
      const business = await loadBusiness(user.id)
      navigate(business ? '/dashboard' : '/configurar', { replace: true })
    } catch (err) {
      setError(getUserFacingErrorMessage(err, { context: 'google' }))
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <>
      {/* Modal cuenta creada */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: '75%',
            maxWidth: 360,
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px 24px 28px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '12px',
            position: 'relative',
            textAlign: 'center',
          }}>
            <button
              onClick={() => navigate('/configurar', { replace: true })}
              style={{
                position: 'absolute', top: 12, right: 14,
                background: 'none', border: 'none',
                fontSize: '18px', cursor: 'pointer',
                color: 'var(--color-text-secondary)',
              }}
            >
              ✕
            </button>

            <img src="/cuentaCreadaa.png" alt="Cuenta creada" style={{ width: '80%', maxWidth: 200 }} />

            <h2 style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.3, margin: 0 }}>
              ¡Cuenta creada correctamente!
            </h2>

            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Ya casi terminamos. Ahora configurá tu negocio para comenzar a usar{' '}
              <strong style={{ color: 'var(--color-primary)' }}>EmprendeBot.</strong>
            </p>

            <button
              onClick={() => navigate('/configurar', { replace: true })}
              style={{
                marginTop: '8px',
                width: '100%', height: 52,
                background: brand.primaryGradient,
                color: '#fff', border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-family)',
                letterSpacing: '0.5px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              CONTINUAR →
            </button>
          </div>
        </div>
      )}
      <AuthLayout
        title="Empezá hoy"
        subtitle="Completá tus datos para crear tu cuenta."
        onBack={() => navigate('/')}
        illustrationSrc="/crear-cuenta.png"
        illustrationAlt="EmprendeBot creando una cuenta"
      >
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Nombre completo"
            placeholder="Ej: María García"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            autoComplete="name"
          />

          <Input
            label="Email"
            type="email"
            placeholder="nombre@correo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />

          <Input
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            autoComplete="new-password"
            endAdornment={(
              <PasswordVisibilityButton
                visible={showPassword}
                onClick={() => setShowPassword(value => !value)}
              />
            )}
          />

          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '-12px' }}>
            La contraseña necesita: mínimo 8 caracteres, una mayúscula, una minúscula y un símbolo (@, $, *, ?, &...).
          </p>

          <Input
            label="Repetir contraseña"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Repetí tu contraseña"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            error={confirmPassword && password !== confirmPassword ? 'Las contraseñas no coinciden' : undefined}
            endAdornment={(
              <PasswordVisibilityButton
                visible={showConfirmPassword}
                onClick={() => setShowConfirmPassword(value => !value)}
              />
            )}
          />

          {error && (
            <p style={{ fontSize: '13px', color: 'var(--color-error)', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading} disabled={googleLoading} style={{ background: brand.primaryGradient, borderRadius: 'var(--radius-md)', border: 'none' }}>
            CREAR CUENTA
          </Button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 0', color: 'var(--color-text-secondary)' }}>
          <span style={{ height: 1, flex: 1, background: 'var(--color-border)' }} />
          <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>o continuar con</span>
          <span style={{ height: 1, flex: 1, background: 'var(--color-border)' }} />
        </div>

        <GoogleAuthButton
          onSuccess={handleGoogleLogin}
          onError={() => setError('No pudimos iniciar sesión con Google.')}
          disabled={loading || googleLoading}
        />

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
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Iniciá sesión
          </Link>
        </p>
      </AuthLayout>
    </>
  )
}
