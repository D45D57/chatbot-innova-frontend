import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

interface Position {
  x: number
  y: number
}

interface UseDraggableWindowOptions {
  enabled: boolean
  margin?: number
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), Math.max(minimum, maximum))

export function useDraggableWindow({ enabled, margin = 22 }: UseDraggableWindowOptions) {
  const windowRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    pointerId: number
    offsetX: number
    offsetY: number
  } | null>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const constrainPosition = useCallback((candidate: Position): Position => {
    const element = windowRef.current
    if (!element) return candidate

    const maximumX = window.innerWidth - element.offsetWidth - margin
    const maximumY = window.innerHeight - element.offsetHeight - margin

    return {
      x: clamp(candidate.x, margin, maximumX),
      y: clamp(candidate.y, margin, maximumY),
    }
  }, [margin])

  const placeAtInitialPosition = useCallback(() => {
    const element = windowRef.current
    if (!element || !enabled) return

    setPosition(constrainPosition({
      x: window.innerWidth - element.offsetWidth - margin,
      y: window.innerHeight - element.offsetHeight - margin,
    }))
  }, [constrainPosition, enabled, margin])

  useLayoutEffect(() => {
    if (enabled) placeAtInitialPosition()
  }, [enabled, placeAtInitialPosition])

  useEffect(() => {
    if (!enabled) return

    const handleResize = () => {
      setPosition(current => current ? constrainPosition(current) : current)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [constrainPosition, enabled])

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!enabled || event.button !== 0) return
    if ((event.target as HTMLElement).closest('button, a, input, textarea, select')) return

    const element = windowRef.current
    if (!element) return

    const bounds = element.getBoundingClientRect()
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!enabled || !drag || drag.pointerId !== event.pointerId) return

    setPosition(constrainPosition({
      x: event.clientX - drag.offsetX,
      y: event.clientY - drag.offsetY,
    }))
  }

  const finishDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
    setIsDragging(false)
  }

  return {
    windowRef,
    position,
    isDragging,
    dragHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finishDrag,
      onPointerCancel: finishDrag,
    },
  }
}
