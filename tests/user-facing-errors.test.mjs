import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const readSource = relativePath =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8')

const apiClient = readSource('src/services/apiClient.ts')
const login = readSource('src/pages/LoginPage.tsx')
const register = readSource('src/pages/RegisterPage.tsx')
const presentation = readSource('src/pages/PresentationPage.tsx')
const faqHook = readSource('src/hooks/useFaqs.ts')
const dashboard = readSource('src/pages/DashboardPage.tsx')
const budgetDetail = readSource('src/pages/PresupuestoDetailPage.tsx')

test('apiClient no convierte mensajes técnicos remotos en texto público', () => {
  assert.doesNotMatch(apiClient, /data\?\.(?:error|message)/)
  assert.match(apiClient, /throw new ApiError\(apiStatusMessage\(response\.status, 'default'\)/)
  assert.match(apiClient, /No pudimos completar la solicitud\. Intentá nuevamente\./)
  assert.match(apiClient, /No pudimos comunicarnos con el servidor\. Intentá nuevamente\./)
})

test('autenticación utiliza mensajes locales según contexto', () => {
  assert.match(apiClient, /Usuario o contraseña incorrectos\./)
  assert.match(apiClient, /No tenés permisos para realizar esta acción\./)
  assert.match(apiClient, /if \(context === 'login'\) return 'No pudimos iniciar sesión\. Intentá nuevamente\.'/)
  assert.match(apiClient, /if \(context === 'register'\) return 'No pudimos crear la cuenta\. Intentá nuevamente\.'/)
  assert.match(apiClient, /No pudimos iniciar sesión con Google\. Intentá nuevamente\./)
  assert.match(login, /getUserFacingErrorMessage\(err, \{ context: 'login'/)
  assert.match(register, /getUserFacingErrorMessage\(err, \{ context: 'register'/)
  assert.match(login, /getUserFacingErrorMessage\(err, \{ context: 'google'/)
  assert.match(register, /getUserFacingErrorMessage\(err, \{ context: 'google'/)
  assert.match(presentation, /getUserFacingErrorMessage\(error, \{ context: 'google'/)
})

test('FAQ no expone mensajes de integración ni términos internos', () => {
  assert.match(faqHook, /Tu sesión venció\. Iniciá sesión nuevamente\./)
  assert.match(faqHook, /Primero completá la configuración de tu negocio/)
  assert.doesNotMatch(faqHook, /integración de autenticación|bot\/negocio/i)
})

test('Dashboard y Presupuestos usan explicaciones funcionales', () => {
  assert.match(dashboard, /Estimación basada en consultas atendidas sin intervención humana\./)
  assert.match(budgetDetail, /El total se actualizará automáticamente con los importes ingresados\./)
  assert.doesNotMatch(`${dashboard}\n${budgetDetail}`, /backend/i)
})
