import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { useDraggableWindow } from '../../hooks/useDraggableWindow'

interface FloatingChatWindowProps {
  children: (dragHandleProps: HTMLAttributes<HTMLElement>) => ReactNode
  draggable: boolean
  preview?: boolean
  className?: string
}

export function FloatingChatWindow({
  children,
  draggable,
  preview = false,
  className = '',
}: FloatingChatWindowProps) {
  const { windowRef, position, isDragging, dragHandleProps } = useDraggableWindow({
    enabled: draggable,
  })

  const positionStyle = position
    ? { left: position.x, right: 'auto', top: position.y, bottom: 'auto' }
    : undefined

  return (
    <div
      ref={windowRef}
      className={`floating-chat-window${isDragging ? ' floating-chat-window--dragging' : ''}${className ? ` ${className}` : ''}`}
      style={positionStyle as CSSProperties}
      role={preview ? 'dialog' : undefined}
      aria-modal={preview ? true : undefined}
      aria-label={preview ? 'Vista previa del chatbot' : undefined}
    >
      {children(draggable ? dragHandleProps : {})}
    </div>
  )
}
