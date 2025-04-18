import api from './api';

const whatsappService = {
  // Gestión de sesiones
  getSessions: () => api.get('/whatsapp/sessions'),
  
  getSessionStatus: (sessionId) => api.get(`/whatsapp/sessions/${sessionId}/status`),
  
  createSession: (phoneNumber) => api.post('/whatsapp/sessions', { phoneNumber }),
  
  logout: (phoneNumber) => api.post(`/whatsapp/sessions/${phoneNumber}/logout`),
  
  // Gestión de chats
  getChats: (phoneNumber, options = {}) => {
    const { limit = 50, offset = 0, search = '', includeMessages = false } = options;
    return api.get(`/whatsapp/sessions/${phoneNumber}/chats`, {
      params: { limit, offset, search, includeMessages }
    });
  },
  
  syncChats: (phoneNumber) => api.post(`/whatsapp/sessions/${phoneNumber}/sync/chats`),
  
  // Gestión de mensajes
  getChatMessages: (phoneNumber, chatId, options = {}) => {
    const { limit = 50, before = null } = options;
    return api.get(`/whatsapp/sessions/${phoneNumber}/chats/${chatId}/messages`, {
      params: { limit, before }
    });
  },
  
  sendMessage: (phoneNumber, to, text) => 
    api.post(`/whatsapp/sessions/${phoneNumber}/messages`, { to, text }),
  
  sendMediaMessage: (phoneNumber, to, formData) => 
    api.post(`/whatsapp/sessions/${phoneNumber}/messages/media`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      params: { to }
    }),
  
  // Gestión de contactos
  getContacts: (phoneNumber, options = {}) => {
    const { limit = 100, offset = 0, search = '' } = options;
    return api.get(`/whatsapp/sessions/${phoneNumber}/contacts`, {
      params: { limit, offset, search }
    });
  },
  
  syncContacts: (phoneNumber) => api.post(`/whatsapp/sessions/${phoneNumber}/sync/contacts`),
  
  // Exportación de chat
  exportChatHistory: (phoneNumber, chatId, format = 'json') =>
    api.get(`/whatsapp/sessions/${phoneNumber}/chats/${chatId}/export`, {
      params: { format },
      responseType: format === 'json' ? 'json' : 'blob'
    }),
  
  // Marcar chat como leído
  markChatAsRead: (phoneNumber, chatId) =>
    api.post(`/whatsapp/sessions/${phoneNumber}/chats/${chatId}/read`)
};

export default whatsappService; 