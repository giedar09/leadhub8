import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'

// Importar desde el barrel
import { Home, Login, NotFound, WhatsappDashboard } from './pages'

// Componente de carga
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
)

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/whatsapp" element={<WhatsappDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default App 