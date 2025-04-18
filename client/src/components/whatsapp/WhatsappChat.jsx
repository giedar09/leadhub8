import { useState, useEffect, useRef } from 'react';
import { useWhatsappStore } from '../../stores/whatsappStore';

// Componente de mensaje
const MessageBubble = ({ message, isLast }) => {
  const fromMe = message.fromMe;
  
  // Determinar el tipo de contenido
  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="mb-1">
            <img 
              src={message.media?.url} 
              alt="Imagen" 
              className="max-w-xs rounded-lg"
              loading="lazy"
            />
            {message.content && <p className="mt-1">{message.content}</p>}
          </div>
        );
      case 'video':
        return (
          <div className="mb-1">
            <video 
              src={message.media?.url} 
              controls 
              className="max-w-xs rounded-lg"
            />
            {message.content && <p className="mt-1">{message.content}</p>}
          </div>
        );
      case 'audio':
        return (
          <div className="mb-1">
            <audio src={message.media?.url} controls className="max-w-xs" />
          </div>
        );
      case 'document':
        return (
          <div className="mb-1 flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div>
              <a 
                href={message.media?.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline block"
              >
                Descargar documento
              </a>
              {message.content && <p className="text-sm">{message.content}</p>}
            </div>
          </div>
        );
      default:
        return <p>{message.content}</p>;
    }
  };
  
  // Formatear timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Asignar clases según si el mensaje es enviado por mí o recibido
  const bubbleClass = fromMe
    ? 'bg-green-100 rounded-lg p-3 self-end max-w-xs'
    : 'bg-white rounded-lg p-3 self-start max-w-xs';
    
  const containerClass = fromMe
    ? 'flex flex-col items-end'
    : 'flex flex-col items-start';
    
  return (
    <div className={`${containerClass} mb-4`}>
      <div className={bubbleClass}>
        {!fromMe && <p className="text-xs text-green-600 font-medium mb-1">{message.sender}</p>}
        {renderContent()}
        <div className="text-right">
          <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
          {fromMe && (
            <span className="ml-1">
              {message.status === 'sending' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {message.status === 'sent' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500 inline" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {message.status === 'delivered' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500 inline" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.707 7.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L12 9.586l-2.293-2.293zM5 13a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" />
                </svg>
              )}
              {message.status === 'read' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500 inline" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.707 7.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L12 9.586l-2.293-2.293zM5 13a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" />
                </svg>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const WhatsappChat = () => {
  const { 
    activeSession, 
    activeChat, 
    messages, 
    loadMessages, 
    sendMessage,
    sendMediaMessage,
    setActiveChat,
    markChatAsRead
  } = useWhatsappStore();
  
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [fileToSend, setFileToSend] = useState(null);
  const [fileCaption, setFileCaption] = useState('');
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Cargar mensajes al montar o cambiar de chat
  useEffect(() => {
    if (activeSession && activeChat) {
      loadChatMessages();
      markChatAsRead(activeSession.phoneNumber, activeChat._id)
        .catch(error => console.error('Error al marcar chat como leído:', error));
    }
  }, [activeSession, activeChat]);
  
  // Scroll al último mensaje cuando se cargan o envían mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages[activeChat?._id]]);
  
  // Función para cargar mensajes
  const loadChatMessages = async () => {
    if (!activeSession || !activeChat) return;
    
    try {
      setIsLoading(true);
      await loadMessages(activeSession.phoneNumber, activeChat._id);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manejar envío de mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !fileToSend) return;
    
    if (!activeSession || !activeChat) {
      alert('No hay sesión activa o chat seleccionado');
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (fileToSend) {
        // Enviar mensaje con archivo adjunto
        await sendMediaMessage(
          activeSession.phoneNumber, 
          activeChat.phoneNumber || activeChat.jid, 
          fileToSend, 
          fileCaption
        );
        
        // Limpiar estado del archivo
        setFileToSend(null);
        setFileCaption('');
      } else {
        // Enviar mensaje de texto
        await sendMessage(
          activeSession.phoneNumber, 
          activeChat.phoneNumber || activeChat.jid, 
          newMessage
        );
      }
      
      // Limpiar mensaje
      setNewMessage('');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert('Error al enviar mensaje: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manejar selección de archivo
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileToSend(file);
      setShowAttachMenu(false);
    }
  };
  
  // Cancelar selección de archivo
  const handleCancelFile = () => {
    setFileToSend(null);
    setFileCaption('');
  };
  
  // Volver a la lista de chats (móvil)
  const handleBack = () => {
    setActiveChat(null);
  };
  
  // Obtener el nombre para mostrar
  const getDisplayName = () => {
    if (!activeChat) return '';
    return activeChat.name || activeChat.phoneNumber || 'Chat';
  };
  
  // Obtener la URL de la imagen de perfil
  const getProfilePic = () => {
    if (!activeChat || !activeChat.profilePicUrl) return null;
    return activeChat.profilePicUrl;
  };
  
  const chatMessages = activeChat && messages[activeChat._id] ? messages[activeChat._id] : [];
  
  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Encabezado */}
      <div className="flex items-center p-3 bg-gray-200 border-b">
        <button 
          className="md:hidden mr-2 p-1 rounded-full hover:bg-gray-300"
          onClick={handleBack}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex items-center flex-1">
          {getProfilePic() ? (
            <img 
              src={getProfilePic()} 
              alt={getDisplayName()} 
              className="w-10 h-10 rounded-full mr-3 object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
              <span className="text-gray-600 text-lg font-medium">
                {getDisplayName()[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          
          <div>
            <h3 className="font-medium text-gray-900">{getDisplayName()}</h3>
            {activeChat?.isGroup && <p className="text-xs text-gray-500">Grupo · {activeChat?.participants?.length || 0} participantes</p>}
          </div>
        </div>
      </div>
      
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="rgba(0,0,0,.03)" fill-rule="evenodd"/%3E%3C/svg%3E")' }}>
        {isLoading && chatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <div>
            {chatMessages.map((message, index) => (
              <MessageBubble 
                key={message._id || index} 
                message={message} 
                isLast={index === chatMessages.length - 1}
              />
            ))}
            <div ref={messagesEndRef} />
            
            {chatMessages.length === 0 && !isLoading && (
              <div className="text-center my-12 text-gray-500">
                <p>No hay mensajes aún</p>
                <p className="text-sm mt-2">Envía un mensaje para comenzar la conversación</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Vista previa del archivo a enviar */}
      {fileToSend && (
        <div className="p-3 bg-gray-50 border-t">
          <div className="flex items-start">
            <div className="flex-1">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="font-medium truncate">{fileToSend.name}</span>
                <span className="ml-2 text-xs text-gray-500">
                  ({Math.round(fileToSend.size / 1024)} KB)
                </span>
              </div>
              
              <input
                type="text"
                placeholder="Añadir un pie de foto..."
                className="mt-2 w-full p-2 border rounded text-sm"
                value={fileCaption}
                onChange={(e) => setFileCaption(e.target.value)}
              />
            </div>
            
            <button 
              onClick={handleCancelFile}
              className="ml-3 p-1 text-red-500 hover:bg-red-50 rounded"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Formulario de mensaje */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t flex items-center">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          {/* Menú de adjuntos */}
          {showAttachMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg py-2 w-48">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Imagen o video
              </button>
              
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Documento
              </button>
            </div>
          )}
        </div>
        
        <input
          type="text"
          placeholder="Escribe un mensaje aquí"
          className="flex-1 p-3 mx-3 bg-gray-100 rounded-lg focus:outline-none"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={isLoading}
        />
        
        <button
          type="submit"
          className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300"
          disabled={isLoading || (!newMessage.trim() && !fileToSend)}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default WhatsappChat; 