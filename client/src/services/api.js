import axios from 'axios';

// Configuración por defecto
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Crear instancia de axios con URL base
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para incluir token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage') 
      ? JSON.parse(localStorage.getItem('auth-storage')).state.token 
      : null;
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar errores globales (por ejemplo, redirección en caso de 401)
    if (error.response && error.response.status === 401) {
      // Redireccionar a login o limpiar sesión
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Exportar métodos comunes
export const apiService = {
  // Autenticación
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  
  // Usuarios
  getCurrentUser: () => api.get('/users/me'),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  
  // Contactos
  getContacts: (params) => api.get('/contacts', { params }),
  getContact: (id) => api.get(`/contacts/${id}`),
  createContact: (contactData) => api.post('/contacts', contactData),
  updateContact: (id, contactData) => api.put(`/contacts/${id}`, contactData),
  deleteContact: (id) => api.delete(`/contacts/${id}`),
  
  // Chats/Mensajes
  getChats: () => api.get('/chats'),
  getChat: (id) => api.get(`/chats/${id}`),
  getMessages: (chatId, params) => api.get(`/chats/${chatId}/messages`, { params }),
  sendMessage: (chatId, messageData) => api.post(`/chats/${chatId}/messages`, messageData),
};

export default api; 