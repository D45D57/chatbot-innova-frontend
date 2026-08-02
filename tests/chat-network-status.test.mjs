import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const readSource = relativePath => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8')
const hook = readSource('src/hooks/useNetworkStatus.ts')
const page = readSource('src/pages/ChatbotPage.tsx')
const notice = readSource('src/components/chat/ConnectionNotice.tsx')
const useChat = readSource('src/hooks/useChat.ts')
const errors = readSource('src/utils/networkError.ts')
const quickReplies = readSource('src/components/chat/QuickReplies.tsx')
const styles = readSource('src/index.css')

test('el hook inicia con navigator.onLine, escucha ambos eventos y limpia listeners', () => {
  assert.match(hook, /useState\(\(\) => navigator\.onLine\)/)
  assert.match(hook, /addEventListener\('offline'/)
  assert.match(hook, /addEventListener\('online'/)
  assert.match(hook, /removeEventListener\('offline'/)
  assert.match(hook, /removeEventListener\('online'/)
})

test('el aviso es accesible y el reintento evita múltiples ejecuciones', () => {
  assert.match(notice, /role="status" aria-live="polite" aria-busy={isRetrying}/)
  assert.match(notice, /Sin conexión/)
  assert.match(notice, /Verificando conexión…/)
  assert.match(notice, /Seguís sin conexión\. Revisá tu internet e intentá nuevamente\./)
  assert.match(notice, /disabled={isRetrying}/)
  assert.match(page, /if \(!slug \|\| isRetrying\) return/)
  assert.match(page, /if \(!navigator\.onLine\)/)
  assert.match(page, /Promise\.all\(\[/)
})

test('el aviso ocupa una fila propia sin superponer mensajes ni dejar huecos al ocultarse', () => {
  assert.match(styles, /grid-template-rows:\s*auto auto minmax\(0, 1fr\) auto auto/)
  assert.match(styles, /grid-template-areas:[\s\S]*"header"[\s\S]*"connection"[\s\S]*"messages"[\s\S]*"suggestions"[\s\S]*"input"/)
  assert.match(styles, /\.public-chat__connection\s*{[\s\S]*grid-area: connection/)
  assert.match(styles, /\.public-chat__messages\s*{[\s\S]*grid-area: messages/)
  assert.doesNotMatch(styles, /\.public-chat__connection\s*{[^}]*position:\s*(?:absolute|fixed|sticky)/)
})

test('el reintento recupera estado pero no reenvía operaciones sensibles', () => {
  const retry = page.slice(page.indexOf('const retryConnection'), page.indexOf('if (isBusinessLoading'))
  assert.match(retry, /getPublicBusinessApi|getPublicFaqsApi|getPublicProductsApi/)
  assert.doesNotMatch(retry, /createPublicConsultation|updatePublicContact|createPublicBudget|savePublicMessage/)
})

test('los errores HTTP no se clasifican como desconexión', () => {
  assert.match(errors, /error instanceof ApiError\) return false/)
  assert.match(errors, /error instanceof TypeError/)
  assert.match(errors, /failed to fetch/)
})

test('no se confirma una derivación si falla el envío remoto', () => {
  const contact = useChat.slice(useChat.indexOf("if (awaitingInput === 'contact-phone')"), useChat.indexOf('const response = quickReply'))
  assert.match(contact, /await updatePublicContact/)
  assert.match(contact, /catch \(error\)/)
  assert.match(contact, /return/)
})

test('los íconos esenciales son SVG locales y las imágenes remotas tienen fallback', () => {
  assert.doesNotMatch(quickReplies, /<img/)
  assert.match(quickReplies, /<AppIcon name={icon}/)
  assert.match(readSource('src/components/ui/Avatar.tsx'), /onError/)
  assert.match(readSource('src/components/chat/ProductCatalogMessage.tsx'), /onError/)
})
