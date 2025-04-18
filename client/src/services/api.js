import axios from 'axios';

// Configuración de la API base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para añadir el token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores comunes
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    // Si el error es 401 Unauthorized, redirigir a login
    if (response && response.status === 401) {
      localStorage.removeItem('auth_token');
      
      // Solo redirigir si no estamos ya en la página de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
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