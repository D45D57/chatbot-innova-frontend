import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { brand } from '../styles/brand'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta')
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
              onClick={() => navigate('/configurar')}
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
              onClick={() => navigate('/configurar')}
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
      {/* Back */}
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
          ← Iniciar sesion
        </button>
      </div>

      <div style={{ flex: 1, padding: '8px 24px 40px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '6px' }}>
          Empezá hoy
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
          Completá tus datos para crear tu cuenta.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

          <Button type="submit" fullWidth size="lg" loading={loading} style={{ background: brand.primaryGradient, borderRadius: 'var(--radius-md)', border: 'none' }}>
            CREAR CUENTA
          </Button>
        </form>

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
      title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      style={{
        width: '52px',
        height: '52px',
        display: 'grid',
        placeItems: 'center',
        border: 'none',
        background: 'transparent',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
      }}
    >
      {visible ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m3 3 18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 9 4.5 10 8a13.7 13.7 0 0 1-2.1 4.2" />
          <path d="M6.6 6.6A13.6 13.6 0 0 0 2 12c1 3.5 5 8 10 8a10.7 10.7 0 0 0 5.4-1.5" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  )
}
