import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function SplashPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/presentacion'), 2200)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="eb-splash">
      <div className="eb-splash__content">
        <div className="eb-splash__robot-wrap">
          <img
            src="/isoBot-transparente.png"
            alt="EmprendeBot"
            className="eb-splash__robot"
          />
          <span className="eb-splash__shadow" aria-hidden="true" />
        </div>

        <div className="eb-splash__copy">
          <h1>EmprendeBot</h1>
          <p>Tu asistente para vender más</p>
        </div>

        <div className="eb-splash__loader" aria-label="Cargando">
          <span />
          <span />
          <span />
        </div>
      </div>

      <style>{`
        .eb-splash {
          position: fixed;
          inset: 0;
          z-index: 9999;
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 32%, rgba(255, 255, 255, 0.16), transparent 34%),
            linear-gradient(145deg, #13a8a2 0%, #0f8f8a 48%, #255f80 100%);
        }

        .eb-splash__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 26px;
          padding: 32px;
          text-align: center;
        }

        .eb-splash__robot-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: eb-splash-arrive 0.72s cubic-bezier(.2, .9, .3, 1.2) both;
        }

        .eb-splash__robot {
          width: clamp(128px, 28vw, 168px);
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 20px 24px rgba(1, 34, 48, 0.26));
          animation: eb-splash-bounce 1.25s 0.58s ease-in-out both;
        }

        .eb-splash__shadow {
          width: 94px;
          height: 11px;
          margin-top: 8px;
          border-radius: 999px;
          background: rgba(0, 24, 34, 0.28);
          filter: blur(4px);
          animation: eb-splash-shadow 1.25s 0.58s ease-in-out both;
        }

        .eb-splash__copy {
          color: #fff;
          animation: eb-splash-copy 0.45s 0.62s ease-out both;
        }

        .eb-splash__copy h1 {
          margin: 0;
          font-family: var(--font-family);
          font-size: clamp(34px, 8vw, 44px);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -1.2px;
        }

        .eb-splash__copy p {
          margin: 7px 0 0;
          color: rgba(255, 255, 255, 0.76);
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.1px;
        }

        .eb-splash__loader {
          display: flex;
          gap: 7px;
          animation: eb-splash-copy 0.35s 0.9s ease-out both;
        }

        .eb-splash__loader span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.72);
          animation: eb-splash-dot 1s ease-in-out infinite;
        }

        .eb-splash__loader span:nth-child(2) { animation-delay: 0.16s; }
        .eb-splash__loader span:nth-child(3) { animation-delay: 0.32s; }

        @keyframes eb-splash-arrive {
          from { opacity: 0; transform: translateY(-120px) scale(.82); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes eb-splash-bounce {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-18px); }
          48% { transform: translateY(0); }
          68% { transform: translateY(-8px); }
          84% { transform: translateY(0); }
        }

        @keyframes eb-splash-shadow {
          0%, 100% { transform: scaleX(1); opacity: .9; }
          25% { transform: scaleX(.62); opacity: .48; }
          48% { transform: scaleX(1); opacity: .9; }
          68% { transform: scaleX(.78); opacity: .62; }
        }

        @keyframes eb-splash-copy {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes eb-splash-dot {
          0%, 100% { opacity: .35; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .eb-splash__robot-wrap,
          .eb-splash__robot,
          .eb-splash__shadow,
          .eb-splash__copy,
          .eb-splash__loader,
          .eb-splash__loader span {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
