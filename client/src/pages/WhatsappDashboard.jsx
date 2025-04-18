import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WhatsappSidebar from '../components/whatsapp/WhatsappSidebar';
import WhatsappChat from '../components/whatsapp/WhatsappChat';
import WhatsappSessionManager from '../components/whatsapp/WhatsappSessionManager';
import { useWhatsappStore } from '../stores/whatsappStore';

const WhatsappDashboard = () => {
  const navigate = useNavigate();
  const { 
    activeSession, 
    activeChat, 
    setActiveChat,
    isSessionManagerOpen, 
    toggleSessionManager 
  } = useWhatsappStore();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Detector de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirigir a la página de inicio si no hay sesión activa
  useEffect(() => {
    if (!activeSession && !isSessionManagerOpen) {
      toggleSessionManager(true);
    }
  }, [activeSession, isSessionManagerOpen, toggleSessionManager]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Panel lateral */}
      {(!isMobile || !activeChat) && (
        <div className={`${activeChat && isMobile ? 'hidden' : 'flex'} w-full md:w-1/3 lg:w-1/4 bg-white border-r`}>
          <WhatsappSidebar />
        </div>
      )}
      
      {/* Panel de chat */}
      {(!isMobile || activeChat) && (
        <div className={`${!activeChat && isMobile ? 'hidden' : 'flex'} flex-col w-full md:w-2/3 lg:w-3/4`}>
          {activeChat ? (
            <WhatsappChat />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center p-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Selecciona un chat</h3>
                <p className="mt-2 text-gray-500">
                  Elige una conversación de la lista para comenzar a chatear
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Modal de gestión de sesiones */}
      {isSessionManagerOpen && (
        <WhatsappSessionManager onClose={() => toggleSessionManager(false)} />
      )}
    </div>
  );
};

export default WhatsappDashboard; 