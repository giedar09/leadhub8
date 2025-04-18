import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">LeadHub8 CRM</h1>
        
        <p className="text-gray-600 mb-8">
          Sistema integrado de CRM con funcionalidades de WhatsApp para gestión de contactos,
          conversaciones y seguimiento de clientes.
        </p>
        
        <div className="space-y-4">
          <Link
            to="/whatsapp"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full block transition-colors"
          >
            WhatsApp
          </Link>
          
          <Link
            to="/login"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full block transition-colors"
          >
            Ingresar al CRM
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home 