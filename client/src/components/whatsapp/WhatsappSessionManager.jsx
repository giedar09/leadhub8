import { useState, useEffect } from 'react';
import { useWhatsappStore } from '../../stores/whatsappStore';

const WhatsappSessionManager = ({ onClose }) => {
  const { 
    sessions, 
    loadSessions, 
    createSession, 
    setActiveSession,
    activeSession,
    logoutSession,
    checkSessionStatus,
    isLoading,
    error,
    clearError
  } = useWhatsappStore();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [activeTab, setActiveTab] = useState('connect');
  const [statusInterval, setStatusInterval] = useState(null);
  
  // Cargar sesiones al montar
  useEffect(() => {
    loadSessions().catch(error => console.error('Error al cargar sesiones:', error));
    
    // Limpiar intervalo al desmontar
    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, []);
  
  // Validar formato de número
  const isValidPhoneNumber = (number) => {
    return /^\d{10,15}$/.test(number.replace(/\D/g, ''));
  };
  
  // Iniciar nueva sesión
  const handleStartSession = async (e) => {
    e.preventDefault();
    
    if (!isValidPhoneNumber(phoneNumber)) {
      alert('Por favor ingresa un número de teléfono válido (10-15 dígitos)');
      return;
    }
    
    // Limpiar errores previos
    clearError();
    
    try {
      // Crear nueva sesión
      const session = await createSession(phoneNumber);
      
      // Iniciar verificación periódica de estado
      const interval = setInterval(() => {
        checkSessionStatus(session._id).then(status => {
          // Si el estado es conectado, establecer como sesión activa
          if (status && status.status === 'connected') {
            setActiveSession(status);
            clearInterval(interval);
            onClose();
          }
        });
      }, 3000);
      
      setStatusInterval(interval);
      
      // Cambiar a la pestaña de QR
      setActiveTab('qr');
    } catch (error) {
      console.error('Error al crear sesión:', error);
    }
  };
  
  // Seleccionar sesión existente
  const handleSelectSession = (session) => {
    setActiveSession(session);
    onClose();
  };
  
  // Cerrar sesión
  const handleLogout = async (session, e) => {
    e.stopPropagation();
    
    if (window.confirm(`¿Estás seguro de cerrar la sesión de ${session.phoneNumber}?`)) {
      try {
        await logoutSession(session.phoneNumber);
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    }
  };
  
  // Formatear estado para mostrar
  const formatStatus = (status) => {
    const statusMap = {
      'initial': 'Inicial',
      'connecting': 'Conectando...',
      'connected': 'Conectado',
      'authenticated': 'Autenticado',
      'disconnected': 'Desconectado',
      'error': 'Error',
      'logged_out': 'Cerrado'
    };
    
    return statusMap[status] || status;
  };
  
  // Renderizar estado con color
  const renderStatus = (session) => {
    const statusColors = {
      'initial': 'bg-gray-200 text-gray-800',
      'connecting': 'bg-blue-100 text-blue-800',
      'connected': 'bg-green-100 text-green-800',
      'authenticated': 'bg-green-100 text-green-800',
      'disconnected': 'bg-red-100 text-red-800',
      'error': 'bg-red-100 text-red-800',
      'logged_out': 'bg-gray-100 text-gray-800'
    };
    
    const colorClass = statusColors[session.status] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 rounded text-xs ${colorClass}`}>
        {formatStatus(session.status)}
      </span>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Gestión de WhatsApp</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Pestañas */}
        <div className="border-b">
          <nav className="flex">
            <button
              className={`px-4 py-3 font-medium text-sm ${activeTab === 'connect' ? 'text-green-600 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('connect')}
            >
              Nueva conexión
            </button>
            <button
              className={`px-4 py-3 font-medium text-sm ${activeTab === 'sessions' ? 'text-green-600 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('sessions')}
            >
              Sesiones ({sessions.length})
            </button>
            {activeTab === 'qr' && (
              <span className="px-4 py-3 font-medium text-sm text-green-600 border-b-2 border-green-500">
                Escanear QR
              </span>
            )}
          </nav>
        </div>
        
        <div className="p-4">
          {error && (
            <div className="mb-4 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded">
              <div className="flex">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}
          
          {activeTab === 'connect' && (
            <div>
              <p className="mb-4 text-gray-600">
                Ingresa tu número de teléfono para conectar WhatsApp Web. 
                Asegúrate de usar el formato completo con el código de país.
              </p>
              
              <form onSubmit={handleStartSession}>
                <div className="mb-4">
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Número de teléfono
                  </label>
                  <input
                    type="text"
                    id="phoneNumber"
                    placeholder="Ej: 5219991234567"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Incluye el código de país (ej: 52 para México)
                  </p>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Iniciando...
                    </span>
                  ) : (
                    'Iniciar conexión'
                  )}
                </button>
              </form>
            </div>
          )}
          
          {activeTab === 'sessions' && (
            <div>
              {sessions.length === 0 ? (
                <div className="text-center py-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-gray-500">No hay sesiones disponibles</p>
                  <button 
                    onClick={() => setActiveTab('connect')}
                    className="mt-3 text-sm text-green-600 hover:text-green-800"
                  >
                    Crear nueva conexión
                  </button>
                </div>
              ) : (
                <ul className="divide-y">
                  {sessions.map(session => (
                    <li 
                      key={session._id} 
                      className={`py-3 px-2 flex items-center justify-between hover:bg-gray-50 rounded-lg cursor-pointer ${activeSession?._id === session._id ? 'bg-green-50' : ''}`}
                      onClick={() => session.status === 'connected' && handleSelectSession(session)}
                    >
                      <div className="flex items-center">
                        <div className="bg-green-100 rounded-full p-2 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        
                        <div>
                          <p className="font-medium">{session.phoneNumber}</p>
                          <div className="flex items-center mt-1">
                            {renderStatus(session)}
                            <span className="ml-2 text-xs text-gray-500">
                              {new Date(session.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        {session.status === 'connected' && (
                          <button 
                            className="mr-1 p-1 text-green-600 hover:bg-green-100 rounded-full"
                            onClick={() => handleSelectSession(session)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                          </button>
                        )}
                        
                        {(session.status === 'connected' || session.status === 'disconnected') && (
                          <button 
                            className="p-1 text-red-600 hover:bg-red-100 rounded-full"
                            onClick={(e) => handleLogout(session, e)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {activeTab === 'qr' && (
            <div className="py-4">
              <div className="text-center mb-4">
                <h3 className="font-medium text-gray-900">Escanea el código QR con tu teléfono</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Abre WhatsApp en tu teléfono, ve a Configuración &gt; WhatsApp Web y escanea el código
                </p>
              </div>
              
              {sessions.map(session => {
                // Mostrar solo la sesión recién creada que esté en proceso de conexión
                if (session.phoneNumber === phoneNumber && (session.status === 'initial' || session.status === 'connecting')) {
                  return (
                    <div key={session._id} className="flex flex-col items-center">
                      {session.qrCode ? (
                        <img 
                          src={session.qrCode} 
                          alt="Código QR de WhatsApp" 
                          className="w-64 h-64 mx-auto border p-2"
                        />
                      ) : (
                        <div className="w-64 h-64 flex items-center justify-center border">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                        </div>
                      )}
                      
                      <p className="mt-4 text-sm text-gray-600">
                        Estado: {formatStatus(session.status)}
                      </p>
                      
                      <button
                        onClick={() => setActiveTab('sessions')}
                        className="mt-4 text-green-600 text-sm hover:text-green-800"
                      >
                        Ver todas las sesiones
                      </button>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsappSessionManager; 