import type { ButtonHTMLAttributes } from 'react'
import '../../styles/page-navigation.css'

interface PageBackButtonProps extends Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  spacious?: boolean
}

export function PageBackButton({ onClick, spacious = false }: PageBackButtonProps) {
  return (
    <button
      type="button"
      className={`page-back-button${spacious ? ' page-back-button--spacious' : ''}`}
      aria-label="Volver"
      onClick={onClick}
    >
      <span aria-hidden="true">{'<'}</span>
      Volver
    </button>
  )
}
