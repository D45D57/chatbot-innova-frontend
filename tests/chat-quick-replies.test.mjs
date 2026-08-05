import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const readSource = relativePath =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8')

const types = readSource('src/types/index.ts')
const useChat = readSource('src/hooks/useChat.ts')
const chatbotPage = readSource('src/pages/ChatbotPage.tsx')
const quickReplies = readSource('src/components/chat/QuickReplies.tsx')
const quoteSummary = readSource('src/components/chat/QuoteSummaryCard.tsx')
const productCatalog = readSource('src/components/chat/ProductCatalogMessage.tsx')
const storage = readSource('src/services/chatStorage.ts')
const publicApi = readSource('src/services/publicConsultationApi.ts')

test('las quick replies tienen identidad y acción independientes del label', () => {
  assert.match(types, /interface QuickReplyOption[\s\S]*id: string[\s\S]*label: string[\s\S]*action: QuickReplyAction/)
  assert.match(types, /quickReplies\?: QuickReplyOption\[\]/)
  assert.match(quickReplies, /key={option\.id}/)
  assert.match(quickReplies, /{option\.label}/)
  assert.match(quickReplies, /ICON_MAP\[option\.action\]/)
  assert.doesNotMatch(quickReplies, /ICON_MAP\[option\.label\]/)
})

test('volver al menú después de FAQ ejecuta SHOW_MAIN_MENU sin reinterpretar el label', () => {
  assert.match(useChat, /id: 'back-main-menu'[\s\S]*label: 'Volver al menú principal'[\s\S]*action: 'SHOW_MAIN_MENU'/)
  assert.match(useChat, /SHOW_MAIN_MENU: createMainMenuResponse/)
  assert.match(useChat, /quickReply\s*\? generateQuickReplyResponse\(quickReply, business\)/)
  assert.match(useChat, /processMessage\(option\.label, option\)/)
  assert.doesNotMatch(chatbotPage, /sendMessage\('Volver al menú principal'\)/)
})

test('las acciones de FAQ y catálogo están migradas', () => {
  assert.match(useChat, /id: 'repeat-faq-menu'[\s\S]*action: 'SHOW_FAQ_MENU'/)
  assert.match(useChat, /SHOW_FAQ_MENU: \(\) => createFaqMenuResponse\(business\)/)
  assert.match(chatbotPage, /id: 'catalog-back-main-menu'[\s\S]*action: 'SHOW_MAIN_MENU'/)
  assert.match(chatbotPage, /onSelect={handleQuickReply}/)
  assert.match(chatbotPage, /action: 'SELECT_FAQ'/)
  assert.match(useChat, /SELECT_FAQ: \(\) => createSelectedFaqResponse\(option\.value, business\)/)
})

test('la confirmación de presupuesto usa una acción interna estable', () => {
  assert.match(chatbotPage, /id: 'confirm-budget'[\s\S]*action: 'CONFIRM_BUDGET'/)
  assert.match(useChat, /quickReply\?\.action === 'CONFIRM_BUDGET'/)
  assert.doesNotMatch(chatbotPage, /onClick=\{\(\) => sendMessage\('Confirmar presupuesto'\)\}/)
})

test('el regreso desde catálogo y FAQ usa SHOW_MAIN_MENU y conserva sus textos UX', () => {
  assert.match(chatbotPage, /label: 'Volver al menú principal'[\s\S]*action: 'SHOW_MAIN_MENU'/)
  assert.match(useChat, /MAIN_MENU_REPLY[\s\S]*action: 'SHOW_MAIN_MENU'/)
  assert.match(productCatalog, /← Volver al menú/)
  assert.match(quickReplies, /option\.action === 'SHOW_MAIN_MENU'[\s\S]*name="arrowLeft"/)
})

test('el resumen permite solicitar o cancelar mediante acciones separadas', () => {
  assert.match(chatbotPage, /label: 'Solicitar presupuesto'[\s\S]*action: 'REQUEST_BUDGET'/)
  assert.match(chatbotPage, /label: 'Cancelar presupuesto'[\s\S]*action: 'CANCEL_BUDGET'/)
  assert.match(quoteSummary, /'Solicitar presupuesto'/)
  assert.match(quoteSummary, /Cancelar presupuesto/)
  assert.match(quoteSummary, /!isSubmitted[\s\S]*onClick={onCancel}/)
})

test('quote-confirm mantiene confirmar y cancelar y oculta replies antiguas', () => {
  assert.match(chatbotPage, /awaitingInput === 'quote-confirm'/)
  assert.match(chatbotPage, /label: 'Confirmar presupuesto'[\s\S]*action: 'CONFIRM_BUDGET'/)
  assert.match(chatbotPage, /id: 'cancel-confirm-budget'[\s\S]*action: 'CANCEL_BUDGET'/)
  assert.match(chatbotPage, /awaitingInput !== 'quote-confirm'[\s\S]*activeQuickReplies/)
})

test('cancelar limpia el presupuesto pendiente sin llamar al endpoint de creación', () => {
  const cancelBranch = useChat.slice(
    useChat.indexOf("if (quickReply?.action === 'CANCEL_BUDGET')"),
    useChat.indexOf("if (awaitingInput === 'quote-contact-name')"),
  )
  assert.match(cancelBranch, /pendingQuoteRef\.current = null/)
  assert.match(cancelBranch, /savePendingQuote\(business\.id, null\)/)
  assert.match(cancelBranch, /setAwaitingInput\(null\)/)
  assert.match(cancelBranch, /setSubmittingQuoteMessageId\(null\)/)
  assert.match(cancelBranch, /createMainMenuResponse\(\)/)
  assert.doesNotMatch(cancelBranch, /createPublicBudget|updatePublicContact/)
})

test('un presupuesto creado no ofrece cancelación y sí permite volver al menú', () => {
  const successBranch = useChat.slice(
    useChat.indexOf('const generatedMsg: Message'),
    useChat.indexOf('} catch {', useChat.indexOf('const generatedMsg: Message')),
  )
  assert.match(successBranch, /MAIN_MENU_REPLY/)
  assert.doesNotMatch(successBranch, /CANCEL_BUDGET|Cancelar presupuesto/)
})

test('el presupuesto generado apila descargar PDF y compartir', () => {
  const generatedQuoteCard = readSource('src/components/chat/GeneratedQuoteCard.tsx')
  assert.match(
    generatedQuoteCard,
    /chat-quote-card__actions chat-quote-card__actions--stacked/,
  )
})

test('los historiales antiguos y las nuevas acciones siguen siendo válidos', () => {
  assert.match(storage, /typeof reply === 'string' \? migrateLegacyQuickReply/)
  assert.match(storage, /'REQUEST_BUDGET'/)
  assert.match(storage, /'CANCEL_BUDGET'/)
})

test('el texto libre conserva los comandos de menú', () => {
  assert.match(useChat, /function isMenuCommand/)
  assert.match(useChat, /generateBotResponse\(text, business, awaitingInput\)/)
  assert.match(useChat, /message === 'volver al menu principal'/)
})

test('seleccionar una quick reply registra una sola vez el label y no altera el contrato API', () => {
  assert.match(useChat, /const processMessage = useCallback\(async \(text: string, quickReply\?: QuickReplyOption\)/)
  assert.match(useChat, /const userMessage: Message = \{[\s\S]*text,[\s\S]*\}/)
  assert.match(useChat, /savePublicMessage\(business\.slug, consultationId, 'cliente', text\)/)
  assert.equal((useChat.match(/processMessage\(option\.label, option\)/g) ?? []).length, 1)
  assert.match(publicApi, /body: JSON\.stringify\(\{ emisor, contenido, tipoMensaje: 'texto' \}\)/)
})
