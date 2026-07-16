import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function SplashPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/presentacion'), 2200)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #13ABA2 0%, #0a7a74 100%)',
      minHeight: '100svh',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        animation: 'fadeIn 0.6s ease',
      }}>
        {/* Bot icon */}
        <div style={{
          width: 90, height: 90,
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 1.8s ease infinite',
        }}>

        <img src="/imagoBotCirculo.png" alt="EmprendeBot" style={{ width: 60, height: 60 }} />
        </div>

        <p style={{
          color: 'rgba(255,255,255,0.85)',
          fontSize: '14px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          EmprendeBot
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  )
}
