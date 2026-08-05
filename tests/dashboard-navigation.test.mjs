import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const dashboardPage = readFileSync(
  new URL('../src/pages/DashboardPage.tsx', import.meta.url),
  'utf8',
)
const consultasPage = readFileSync(
  new URL('../src/pages/ConsultasPage.tsx', import.meta.url),
  'utf8',
)
const dashboardStats = readFileSync(
  new URL('../src/hooks/useDashboardStats.ts', import.meta.url),
  'utf8',
)
const consultasHook = readFileSync(
  new URL('../src/hooks/useConsultas.ts', import.meta.url),
  'utf8',
)

test('las cuatro tarjetas navegan a sus destinos y filtros', () => {
  assert.match(dashboardPage, /navigate\('\/consultas\?atencion=humana&estado=en_proceso'\)/)
  assert.match(dashboardPage, /navigate\('\/presupuestos'\)/)
  assert.match(dashboardPage, /navigate\('\/metricas'\)/)
  assert.match(dashboardPage, /navigate\('\/consultas\?resolucion=bot'\)/)
})

test('Consultas aplica los filtros recibidos en la URL', () => {
  assert.match(consultasPage, /searchParams\.get\('estado'\)/)
  assert.match(consultasPage, /searchParams\.get\('atencion'\)/)
  assert.match(consultasPage, /searchParams\.get\('resolucion'\)/)
  assert.match(consultasPage, /setSearchParams/)
  assert.match(consultasPage, /Pendientes de atención humana/)
  assert.match(consultasPage, /Resueltas automáticamente/)
  assert.doesNotMatch(consultasPage, /Requieren mi atención/)
  assert.doesNotMatch(consultasPage, /Resueltas por el bot/)
  assert.match(consultasPage, /Cerradas/)
  assert.doesNotMatch(consultasPage, /label: 'Nuevas'/)
  assert.doesNotMatch(consultasPage, /label: 'En proceso'/)
  assert.doesNotMatch(consultasPage, /label: 'Resueltas'/)
  assert.doesNotMatch(consultasPage, />Tipo</)
  assert.doesNotMatch(consultasPage, />Canal</)
})

test('Dashboard y Consultas comparten el criterio de pendientes', () => {
  assert.match(dashboardStats, /isPendingHumanConsultation\(consulta, resolution\)/)
  assert.match(consultasHook, /isPendingHumanConsultation\(consulta, resolution\)/)
})

test('la tarjeta de resueltas cuenta exclusivamente resoluciones del bot', () => {
  assert.match(dashboardStats, /if \(resolution\.resolvedByBot\) resueltas \+= 1/)
})
