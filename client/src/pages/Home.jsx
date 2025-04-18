import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Leadhub8 - CRM + WhatsApp</h1>
      <p className="text-xl text-gray-600 mb-8">Gestiona tus contactos y conversaciones de WhatsApp en un solo lugar</p>
      <div className="space-x-4">
        <Link to="/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Iniciar sesión
        </Link>
        <Link to="/register" className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
          Registrarse
        </Link>
      </div>
    </div>
  )
} 