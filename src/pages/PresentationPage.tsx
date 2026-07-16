import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { brand } from '../styles/brand'

export function PresentationPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100svh',
    }}>
      {/* Hero section */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '24px 32px 32px',
        background: 'var(--color-bg)',
        gap: '16px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}>
          <img src="/isoBot-transparente.png" alt="EmprendeBot" style={{ width: 88, height: 88 }} />
          <span style={{
            fontSize: '22px',
            fontWeight: 700,
            background: brand.primaryGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            EmprendeBot
          </span>
        </div>

        {/* Hola */}
        <h1 style={{
          fontSize: '36px',
          fontWeight: 700,
          margin: '40px 0 0',
          lineHeight: 1.2,
        }}>
          Hola 👋
        </h1>

        {/* Soy EmprendeBot, tu asistente... */}
        <p style={{
          fontSize: '20px',
          fontWeight: 400,
          margin: 0,
          lineHeight: 1.4,
          textAlign: 'left',
          width: '100%',
        }}>
          Soy <strong>EmprendeBot</strong>, tu asistente de gestión comercial.
        </p>

        {/* Te ayudaré... */}
        <p style={{
          fontSize: '16px',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
          margin: '8px 0 0',
          textAlign: 'justify',
          width: '100%',
        }}>
          Te ayudaré a responder consultas, generar presupuestos y potenciar las oportunidades de venta de tu negocio.
        </p>
      </div>

      {/* CTA section */}
      <div style={{
        padding: '16px 24px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'var(--color-bg)',
      }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => navigate('/registro')}
          style={{ background: brand.primaryGradient, borderRadius: 'var(--radius-md)', border: 'none' }}
        >
          CREAR CUENTA
        </Button>

        <p style={{
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
        }}>
          ¿Ya tenés una cuenta?
        </p>

        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={() => navigate('/login')}
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          INICIAR SESIÓN
        </Button>
      </div>
    </div>
  )
}
