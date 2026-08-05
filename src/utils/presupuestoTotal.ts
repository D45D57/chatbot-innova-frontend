import type { Presupuesto } from '../types/presupuesto'

const toValidAmount = (value: unknown): number => {
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0 ? amount : 0
}

export const getEffectivePresupuestoTotal = (
  presupuesto: Pick<Presupuesto, 'total' | 'items'>,
): number => {
  const persistedTotal = toValidAmount(presupuesto.total)
  if (persistedTotal > 0) return persistedTotal

  const computedTotal = presupuesto.items.reduce((sum, item) => {
    const subtotal = toValidAmount(item.subtotal)
    if (subtotal > 0) return sum + subtotal

    return sum
      + toValidAmount(item.precioUnitario) * toValidAmount(item.cantidad)
  }, 0)

  return computedTotal > 0 ? computedTotal : 0
}
