import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-9xl font-bold text-gray-300">404</h1>
      <h2 className="text-2xl font-bold text-gray-800 mt-4 mb-6">Página no encontrada</h2>
      <p className="text-gray-600 mb-8">Lo sentimos, no pudimos encontrar la página que estás buscando.</p>
      <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Volver al inicio
      </Link>
    </div>
  )
} 