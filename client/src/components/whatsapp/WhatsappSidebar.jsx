import { useState, useEffect } from 'react';
import { useWhatsappStore } from '../../stores/whatsappStore';

const WhatsappSidebar = () => {
  const { 
    activeSession, 
    chats, 
    loadChats, 
    setActiveChat, 
    activeChat,
    syncChats,
    toggleSessionManager
  } = useWhatsappStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Cargar chats al montar o cambiar de sesión
  useEffect(() => {
    if (activeSession) {
      loadChatsData();
    }
  }, [activeSession]);
  
  // Función para cargar chats
  const loadChatsData = async () => {
    if (!activeSession) return;
    
    try {
      setIsLoading(true);
      await loadChats(activeSession.phoneNumber, { 
        includeMessages: true,
        search: searchTerm 
      });
    } catch (error) {
      console.error('Error al cargar chats:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manejar búsqueda
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Buscar al presionar Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      loadChatsData();
    }
  };
  
  // Sincronizar chats
  const handleSync = async () => {
    if (!activeSession) return;
    
    try {
      setIsLoading(true);
      await syncChats(activeSession.phoneNumber);
    } catch (error) {
      console.error('Error al sincronizar chats:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Formatear timestamp como hora si es hoy, o fecha si es otro día
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // Si es hoy, mostrar hora
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Si es esta semana, mostrar día
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      return daysOfWeek[date.getDay()];
    }
    
    // Si es otro día, mostrar fecha
    return date.toLocaleDateString();
  };
  
  return (
    <div className="flex flex-col w-full h-full">
      {/* Encabezado */}
      <div className="flex items-center justify-between p-3 bg-green-600 text-white">
        <div className="flex items-center">
          <span className="font-medium text-lg">WhatsApp</span>
          {activeSession && (
            <span className="ml-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
              {activeSession.phoneNumber}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleSync} 
            className="p-2 rounded-full hover:bg-green-700 transition-colors"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button 
            onClick={() => toggleSessionManager(true)}
            className="p-2 rounded-full hover:bg-green-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Búsqueda */}
      <div className="p-2 bg-gray-100">
        <div className="flex items-center bg-white rounded-lg p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar o iniciar un nuevo chat"
            className="flex-1 p-2 outline-none text-sm"
            value={searchTerm}
            onChange={handleSearch}
            onKeyPress={handleKeyPress}
          />
        </div>
      </div>
      
      {/* Lista de chats */}
      <div className="flex-1 overflow-y-auto bg-white">
        {isLoading && chats.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <ul>
            {chats.map(chat => (
              <li 
                key={chat._id}
                className={`flex items-center p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${activeChat?._id === chat._id ? 'bg-gray-100' : ''}`}
                onClick={() => setActiveChat(chat)}
              >
                <div className="relative">
                  {chat.profilePicUrl ? (
                    <img 
                      src={chat.profilePicUrl} 
                      alt={chat.name} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 text-lg font-medium">
                        {chat.name ? chat.name[0].toUpperCase() : '?'}
                      </span>
                    </div>
                  )}
                  
                  {chat.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
                
                <div className="ml-3 flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">{chat.name || chat.phoneNumber}</h3>
                    <span className="text-xs text-gray-500">
                      {formatTime(chat.lastMessageAt)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessageId && chat.lastMessageId.content 
                      ? chat.lastMessageId.content 
                      : chat.lastMessageId?.type === 'image' 
                        ? '📷 Imagen' 
                        : chat.lastMessageId?.type === 'video'
                          ? '📹 Video'
                          : chat.lastMessageId?.type === 'audio'
                            ? '🎵 Audio'
                            : chat.lastMessageId?.type === 'document'
                              ? '📄 Documento'
                              : 'No hay mensajes aún'}
                  </p>
                </div>
              </li>
            ))}
            
            {chats.length === 0 && !isLoading && (
              <div className="p-6 text-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-sm">No hay chats disponibles</p>
                <button 
                  onClick={handleSync}
                  className="mt-2 text-sm text-green-600 hover:text-green-800"
                >
                  Sincronizar chats
                </button>
              </div>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WhatsappSidebar; 