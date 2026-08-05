import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const readSource = relativePath =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8')

const app = readSource('src/App.tsx')
const chatbotPage = readSource('src/pages/ChatbotPage.tsx')
const useChat = readSource('src/hooks/useChat.ts')
const chatRoutes = readSource('src/utils/chatRoutes.ts')
const businessConfig = readSource('src/pages/BusinessConfigPage.tsx')
const floatingWindow = readSource('src/components/chat/FloatingChatWindow.tsx')
const publicBackground = readSource('src/components/chat/PublicChatBackground.tsx')
const draggableHook = readSource('src/hooks/useDraggableWindow.ts')
const chatHeader = readSource('src/components/chat/ChatHeader.tsx')
const styles = readSource('src/index.css')
const previewEntryPoints = [
  'src/pages/DashboardPage.tsx',
  'src/pages/CatalogPage.tsx',
  'src/pages/ConsultasPage.tsx',
  'src/pages/FaqPage.tsx',
  'src/pages/BusinessConfigPage.tsx',
  'src/features/metrics/future/FutureMetricsPage.tsx',
].map(readSource)

test('el modo preview tiene una ruta protegida separada del enlace público', () => {
  assert.match(app, /path={CHAT_PREVIEW_ROUTE}[\s\S]*<ProtectedRoute><ChatbotPage preview \/><\/ProtectedRoute>/)
  assert.match(app, /path={PUBLIC_CHAT_ROUTE} element={<ChatbotPage \/>}/)
  assert.match(chatRoutes, /CHAT_PREVIEW_ROUTE = '\/chat-preview\/:slug'/)
  assert.match(chatRoutes, /PUBLIC_CHAT_ROUTE = '\/:slug'/)
})

test('todos los accesos Probá tu chat abren el preview unificado sobre la pantalla actual', () => {
  for (const source of previewEntryPoints) {
    assert.match(source, /openChatPreview\(business\.slug, navigate\)/)
  }
  assert.match(chatRoutes, /navigate\(getChatPreviewPath\(slug\)/)
  assert.match(chatRoutes, /backgroundPath:/)
  assert.doesNotMatch(chatRoutes, /window\.open/)
})

test('el enlace copiado continúa usando exclusivamente la ruta pública', () => {
  assert.match(businessConfig, /getPublicChatUrl\(form\.slug, window\.location\.origin\)/)
  assert.match(chatRoutes, /getPublicChatPath = \(slug: string\)[\s\S]*`\/\${encodeSlug\(slug\)}`/)
  assert.doesNotMatch(businessConfig, /publicUrl[\s\S]{0,120}chat-preview/)
})

test('la presentación pública usa ayudar.png y no se reutiliza en preview', () => {
  assert.match(publicBackground, /src="\/ayudar\.png"/)
  assert.match(chatbotPage, /<PublicChatBackground variant={publicBackgroundVariant}>{chat}<\/PublicChatBackground>/)
  assert.match(chatbotPage, /<div className="chat-preview-overlay">{chat}<\/div>/)
  assert.doesNotMatch(floatingWindow, /ayudar\.png/)
})

test('la ruta publica fuerza el fondo claro sin depender del tema', () => {
  assert.match(chatbotPage, /const publicBackgroundVariant = 'light'/)
  assert.match(
    chatbotPage,
    /const renderRouteExperience = \(content: ReactNode\) => preview\s*\? content\s*:\s*<div className="public-chat-theme--light">{content}<\/div>/,
  )
  assert.match(publicBackground, /public-chat-background--\$\{variant\}/)
  assert.match(styles, /\.public-chat-background--light\s*{/)
  assert.match(styles, /\.public-chat-background--dark\s*{/)
  assert.match(styles, /\.public-chat-theme--light\s*{[\s\S]*color-scheme: light;/)
  assert.doesNotMatch(publicBackground, /ThemeContext|localStorage|prefers-color-scheme|data-theme/)
  assert.doesNotMatch(chatbotPage, /ThemeContext|useTheme|setTheme|localStorage|prefers-color-scheme|data-theme/)
})

test('la frontera clara cubre carga, errores y chat publico pero no el preview', () => {
  assert.match(chatbotPage, /if \(isBusinessLoading && !business\)\s*{\s*return renderRouteExperience\(/)
  assert.match(chatbotPage, /if \(!business && \(!isBrowserOnline \|\| hasNetworkError\)\)\s*{\s*return renderRouteExperience\(/)
  assert.match(chatbotPage, /if \(!business\)\s*{\s*return renderRouteExperience\(/)
  assert.match(
    chatbotPage,
    /return preview\s*\? <div className="chat-preview-overlay">{chat}<\/div>\s*:\s*renderRouteExperience\(<PublicChatBackground/,
  )
})

test('la frontera publica fija tokens neutrales y conserva los colores del negocio', () => {
  const lightThemeBlock = styles.match(/\.public-chat-theme--light\s*{([\s\S]*?)\n}/)?.[1] ?? ''
  for (const token of [
    '--color-text-primary',
    '--color-text-secondary',
    '--color-border',
    '--color-bg',
    '--color-bg-subtle',
    '--color-bg-answer',
    '--color-surface-muted',
    '--color-field',
    '--shadow-sm',
    '--shadow-md',
    '--shadow-lg',
  ]) {
    assert.match(lightThemeBlock, new RegExp(`${token}:`))
  }
  assert.doesNotMatch(lightThemeBlock, /--chat-primary|--chat-secondary|--chat-gradient/)
  assert.match(chatbotPage, /'--chat-primary': appearance\.primary/)
  assert.match(chatbotPage, /'--chat-secondary': appearance\.secondary/)
  assert.match(chatbotPage, /'--chat-gradient': `linear-gradient\(90deg, \$\{appearance\.primary}, \$\{appearance\.secondary}\)`/)
  assert.match(chatbotPage, /'--color-bg-answer': appearance\.primary/)
})

test('los controles técnicos se habilitan solamente en preview', () => {
  assert.match(chatbotPage, /onRefresh={preview \? \(\) => setPendingConfirmation\([\s\S]*action: reset/)
  assert.match(chatbotPage, /onClose={preview \? closePreview : undefined}/)
  assert.match(chatHeader, /{onClose && \(/)
  assert.match(chatHeader, /aria-label="Cerrar vista previa"/)
})

test('el preview inicia con la configuracion actual y no restaura un saludo anterior', () => {
  assert.match(
    chatbotPage,
    /if \(!preview \|\| previewInitializedRef\.current\) return[\s\S]*previewInitializedRef\.current = true[\s\S]*reset\(\)/,
  )
  assert.match(useChat, /const restorationVersion = conversationVersionRef\.current/)
  assert.match(useChat, /restorationVersion !== conversationVersionRef\.current/)
  assert.match(useChat, /const reset = useCallback[\s\S]*conversationVersionRef\.current \+= 1/)
})

test('la ventana usa Pointer Events y limita su posición al viewport', () => {
  assert.match(draggableHook, /onPointerDown/)
  assert.match(draggableHook, /onPointerMove/)
  assert.match(draggableHook, /onPointerUp: finishDrag/)
  assert.match(draggableHook, /onPointerCancel: finishDrag/)
  assert.match(draggableHook, /setPointerCapture/)
  assert.match(draggableHook, /window\.innerWidth - element\.offsetWidth - margin/)
  assert.match(draggableHook, /window\.innerHeight - element\.offsetHeight - margin/)
  assert.match(draggableHook, /closest\('button, a, input, textarea, select'\)/)
  assert.match(draggableHook, /addEventListener\('resize'/)
})

test('desktop comienza abajo a la derecha y mobile conserva pantalla completa', () => {
  assert.match(styles, /\.floating-chat-window[\s\S]*position: fixed;[\s\S]*right: 22px;[\s\S]*bottom: 22px;/)
  assert.match(draggableHook, /x: window\.innerWidth - element\.offsetWidth - margin/)
  assert.match(styles, /@media \(max-width: 480px\)[\s\S]*\.floating-chat-window[\s\S]*inset: 0 !important;[\s\S]*width: 100%;[\s\S]*height: 100dvh;/)
  assert.match(chatbotPage, /useMediaQuery\('\(min-width: 481px\)'\)/)
  assert.match(floatingWindow, /enabled: draggable/)
})
