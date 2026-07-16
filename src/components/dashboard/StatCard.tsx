import type { ReactNode } from 'react'
import { brand, iconGradients } from '../../styles/brand'

interface StatCardProps {
  label: string
  value: number | string
  description: string
  color: string
  icon: ReactNode
  tone?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

const TONE_BACKGROUNDS: Record<NonNullable<StatCardProps['tone']>, string> = {
  primary: 'rgba(19, 168, 162, 0.12)',
  secondary: 'rgba(37, 99, 235, 0.10)',
  success: 'rgba(34, 197, 94, 0.10)',
  warning: 'rgba(245, 158, 11, 0.12)',
  danger: 'rgba(239, 68, 68, 0.10)',
}

const TONE_GRADIENTS: Record<NonNullable<StatCardProps['tone']>, string> = {
  primary: iconGradients.primary,
  secondary: iconGradients.secondary,
  success: iconGradients.success,
  warning: iconGradients.warning,
  danger: iconGradients.danger,
}

export function StatCard({ label, value, description, color, icon, tone = 'primary' }: StatCardProps) {
  return (
    <div style={{
      position: 'relative',
      minHeight: 148,
      padding: '18px',
      background: 'var(--color-bg)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
      boxShadow: brand.shadowCard,
      overflow: 'hidden',
    }}>
      <span aria-hidden="true" style={{
        position: 'absolute',
        top: -34,
        right: -24,
        width: 106,
        height: 106,
        borderRadius: '50%',
        background: TONE_BACKGROUNDS[tone],
      }} />

      <div style={{
        position: 'relative',
        width: 42,
        height: 42,
        borderRadius: '12px',
        background: TONE_GRADIENTS[tone],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        marginBottom: '13px',
        boxShadow: `0 10px 18px ${color}30`,
      }}>
        {icon}
      </div>

      <div style={{ position: 'relative' }}>
        <p style={{
          fontSize: '28px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          lineHeight: 1.05,
          marginBottom: '5px',
        }}>
          {value}
        </p>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', lineHeight: 1.35 }}>
          {label}
        </p>
        <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '3px', lineHeight: 1.35 }}>
          {description}
        </p>
      </div>
    </div>
  )
}
