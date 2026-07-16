import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import { SplashPage } from './pages/SplashPage'
import { PresentationPage } from './pages/PresentationPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { BusinessConfigPage } from './pages/BusinessConfigPage'
import { DashboardPage } from './pages/DashboardPage'
import { ChatbotPage } from './pages/ChatbotPage'
import { FaqPage } from './pages/FaqPage'
import { ConsultasPage } from './pages/ConsultasPage'
import { CatalogPage } from './pages/CatalogPage'
import { ProductFormPage } from './pages/ProductFormPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Splash + onboarding */}
      <Route path="/" element={<SplashPage />} />
      <Route path="/presentacion" element={<PresentationPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />

      {/* Panel del emprendedor (protegido) */}
      <Route path="/configurar" element={
        <ProtectedRoute><BusinessConfigPage /></ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      } />
      <Route path="/consultas" element={
        <ProtectedRoute><ConsultasPage /></ProtectedRoute>
      } />
      <Route path="/faq" element={
        <ProtectedRoute><FaqPage /></ProtectedRoute>
      } />

      <Route path="/catalogo" element={
        <ProtectedRoute><CatalogPage /></ProtectedRoute>
      } />
      <Route path="/catalogo/agregar" element={
        <ProtectedRoute><ProductFormPage /></ProtectedRoute>
      } />
      <Route path="/catalogo/editar/:id" element={
        <ProtectedRoute><ProductFormPage /></ProtectedRoute>
      } />

      {/* Chatbot público por slug: www.emprendebot/minegocio */}
      <Route path="/:slug" element={<ChatbotPage />} />
    </Routes>
  )
}

export default App
