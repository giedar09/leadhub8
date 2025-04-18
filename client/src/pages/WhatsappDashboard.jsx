import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// URL del servidor backend
const API_URL = 'http://localhost:3000';

const WhatsappDashboard = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('disconnected');
  const [qrCode, setQrCode] = useState('');
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  // Conectar al socket al montar el componente
  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);

    // Eventos de Socket.IO
    newSocket.on('connect', () => {
      console.log('Conectado a Socket.IO');
    });

    newSocket.on('whatsapp:qr', (data) => {
      console.log('QR recibido:', data);
      setQrCode(data.qrImage);
      setStatus('qr_ready');
    });

    newSocket.on('whatsapp:authenticated', (data) => {
      console.log('Autenticado:', data);
      setStatus('authenticated');
      setQrCode(''); // Limpiar QR una vez autenticado
    });

    newSocket.on('whatsapp:ready', (data) => {
      console.log('WhatsApp listo:', data);
      setStatus('connected');
      setActiveSession(data.phoneNumber);
    });

    newSocket.on('whatsapp:disconnected', (data) => {
      console.log('Desconectado:', data);
      setStatus('disconnected');
      if (activeSession === data.phoneNumber) {
        setActiveSession(null);
      }
    });

    newSocket.on('whatsapp:error', (data) => {
      console.error('Error de WhatsApp:', data);
      setError(data.error || 'Error desconocido');
      setStatus('error');
    });

    // Limpieza al desmontar
    return () => {
      if (activeSession) {
        newSocket.emit('whatsapp:unsubscribe', activeSession);
      }
      newSocket.disconnect();
    };
  }, [activeSession]);

  // Iniciar sesión de WhatsApp
  const handleStartSession = async () => {
    if (!phoneNumber || !name) {
      setError('Debes ingresar un número y nombre');
      return;
    }

    setError('');
    setStatus('connecting');

    try {
      // Suscribirse a eventos para este número
      if (socket) {
        socket.emit('whatsapp:subscribe', phoneNumber);
        
        // Iniciar sesión
        socket.emit('whatsapp:init', {
          phoneNumber,
          name
        });
        
        // También podemos usar fetch para la API REST
        const response = await fetch(`${API_URL}/api/whatsapp/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phoneNumber, name }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al iniciar sesión');
        }
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">WhatsApp Dashboard</h1>
      
      {/* Formulario de inicio de sesión */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Iniciar sesión de WhatsApp</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de teléfono (con código de país, ej: 5491123456789)
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="5491123456789"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la sesión
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Mi WhatsApp Personal"
            />
          </div>
          
          <button
            onClick={handleStartSession}
            disabled={status === 'connecting'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {status === 'connecting' ? 'Conectando...' : 'Iniciar Sesión'}
          </button>
        </div>
      </div>
      
      {/* Estado y QR */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Estado de la conexión</h2>
        
        <div className="space-y-4">
          <div>
            <p className="font-medium">
              Estado: 
              <span className={`ml-2 ${
                status === 'connected' ? 'text-green-600' :
                status === 'connecting' || status === 'authenticated' ? 'text-yellow-600' :
                status === 'error' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {status === 'disconnected' && 'Desconectado'}
                {status === 'connecting' && 'Conectando...'}
                {status === 'qr_ready' && 'Escanea el código QR'}
                {status === 'authenticated' && 'Autenticado, inicializando...'}
                {status === 'connected' && 'Conectado'}
                {status === 'error' && 'Error'}
              </span>
            </p>
          </div>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md">
              {error}
            </div>
          )}
          
          {qrCode && (
            <div className="flex flex-col items-center">
              <p className="mb-4 text-sm text-gray-600">
                Escanea este código QR con tu WhatsApp
              </p>
              <div className="border-2 border-gray-300 p-2 rounded-md">
                <img 
                  src={qrCode} 
                  alt="WhatsApp QR Code" 
                  className="w-64 h-64"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Mensajes (se puede ampliar más adelante) */}
      {status === 'connected' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Mensajes</h2>
          
          {messages.length === 0 ? (
            <p className="text-gray-500">No hay mensajes para mostrar.</p>
          ) : (
            <div className="space-y-2">
              {messages.map((msg, index) => (
                <div key={index} className="border-b pb-2">
                  <p>{msg.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhatsappDashboard; 