import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const readSource = relativePath => readFileSync(new URL(relativePath, root), 'utf8')

const readCodeFiles = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const path = join(directory, entry.name)
  if (entry.isDirectory()) return readCodeFiles(path)
  return ['.ts', '.tsx'].includes(extname(path)) ? [readFileSync(path, 'utf8')] : []
})

const confirmationDialog = readSource('src/components/ui/ConfirmationDialog.tsx')
const catalog = readSource('src/pages/CatalogPage.tsx')
const faq = readSource('src/pages/FaqPage.tsx')
const businessConfig = readSource('src/pages/BusinessConfigPage.tsx')
const budgetDetail = readSource('src/pages/PresupuestoDetailPage.tsx')
const consultationDetail = readSource('src/components/consultas/ConsultaDetail.tsx')
const chatbot = readSource('src/pages/ChatbotPage.tsx')
const productForm = readSource('src/pages/ProductFormPage.tsx')
const catalogStyles = readSource('src/styles/catalog.css')
const faqStyles = readSource('src/styles/faq.css')

test('existe una unica base accesible para todas las confirmaciones', () => {
  assert.match(confirmationDialog, /createPortal/)
  assert.match(confirmationDialog, /role="alertdialog"/)
  assert.match(confirmationDialog, /aria-modal="true"/)
  assert.match(confirmationDialog, /cancelButtonRef\.current\?\.focus\(\)/)
  assert.match(confirmationDialog, /event\.key === 'Escape'/)
  assert.match(confirmationDialog, /event\.key !== 'Tab'/)
  assert.match(confirmationDialog, /document\.body\.style\.overflow = 'hidden'/)
  assert.match(confirmationDialog, /cancelLabel = 'Cancelar'/)
  assert.doesNotMatch(confirmationDialog, /AppIcon|confirmation-dialog__icon/)
})

test('no quedan confirmaciones ni alertas nativas en el frontend', () => {
  const source = readCodeFiles(fileURLToPath(new URL('src', root))).join('\n')
  assert.doesNotMatch(source, /window\.(?:confirm|alert)\s*\(/)
  assert.doesNotMatch(source, /(?:^|[^.\w])(?:confirm|alert)\s*\(/m)
})

test('catalogo y FAQ migran sus confirmaciones sin duplicar modales', () => {
  assert.match(catalog, /<ConfirmationDialog[\s\S]*title="¿Eliminar producto\?"/)
  assert.match(catalog, /onConfirm=\{\(\) => void handleDelete\(\)\}/)
  assert.match(faq, /<ConfirmationDialog[\s\S]*title="¿Eliminar FAQ\?"/)
  assert.match(faq, /title="¿Salir sin guardar los cambios\?"/)
  assert.doesNotMatch(catalog, /catalog-delete-modal/)
  assert.doesNotMatch(faq, /faq-delete-modal/)
  assert.doesNotMatch(catalogStyles, /catalog-delete-modal/)
  assert.doesNotMatch(faqStyles, /faq-delete-modal/)
})

test('producto confirma la salida solo cuando el formulario cambio', () => {
  assert.match(productForm, /initialFormSnapshot/)
  assert.match(productForm, /hasUnsavedChanges/)
  assert.match(productForm, /title="¿Salir sin guardar los cambios\?"/)
  assert.match(productForm, /cancelLabel="Seguir editando"/)
})

test('slug definitivo y rechazo conservan sus acciones detras del dialogo comun', () => {
  assert.match(businessConfig, /title="¿Confirmar enlace público\?"/)
  assert.match(businessConfig, /description="Este enlace no podrá volver a modificarse\."/)
  assert.match(businessConfig, /pendingSubmitFormRef\.current\?\.requestSubmit\(\)/)
  assert.match(budgetDetail, /title="¿Rechazar presupuesto\?"/)
  assert.match(budgetDetail, /await handleStatus\(nextStatus\)/)
  assert.match(budgetDetail, /title="¿Cancelar cotización\?"/)
  assert.match(budgetDetail, /quoteItems\.length > 0/)
})

test('cierre de consulta y descartes del chat requieren confirmacion', () => {
  assert.match(consultationDetail, /statusAction\.nextEstado === 'cerrada'/)
  assert.match(consultationDetail, /await onUpdateStatus/)
  assert.match(consultationDetail, /title="¿Cerrar consulta\?"/)
  assert.match(chatbot, /title: '¿Cancelar presupuesto\?'/)
  assert.match(chatbot, /title: '¿Reiniciar chat\?'/)
  assert.match(chatbot, /action: reset/)
  assert.match(chatbot, /<ConfirmationDialog[\s\S]*pendingConfirmation\.action/)
})

test('beforeunload de FAQ se conserva para el cierre nativo de pestaña', () => {
  assert.match(faq, /window\.addEventListener\('beforeunload'/)
})
