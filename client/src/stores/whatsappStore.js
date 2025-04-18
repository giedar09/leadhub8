import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import whatsappService from '../services/whatsappService';

export const useWhatsappStore = create(
  persist(
    (set, get) => ({
      // Estado
      sessions: [],
      activeSession: null,
      chats: [],
      contacts: [],
      activeChat: null,
      messages: {},
      isLoading: false,
      isSessionManagerOpen: false,
      error: null,
      
      // Gestión de sesiones
      setActiveSession: (session) => set({ activeSession: session }),
      setSessions: (sessions) => set({ sessions }),
      
      // Acciones de sesión
      loadSessions: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await whatsappService.getSessions();
          set({ sessions: response.data, isLoading: false });
          return response.data;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || error.message,
            isLoading: false
          });
          throw error;
        }
      },
      
      createSession: async (phoneNumber) => {
        try {
          set({ isLoading: true, error: null });
          const response = await whatsappService.createSession(phoneNumber);
          const sessions = [...get().sessions, response.data];
          set({ 
            sessions,
            activeSession: response.data,
            isLoading: false 
          });
          return response.data;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || error.message, 
            isLoading: false 
          });
          throw error;
        }
      },
      
      checkSessionStatus: async (sessionId) => {
        try {
          const response = await whatsappService.getSessionStatus(sessionId);
          const updatedSessions = get().sessions.map(session => 
            session._id === sessionId ? { ...session, ...response.data } : session
          );
          
          set({ 
            sessions: updatedSessions,
            activeSession: get().activeSession?._id === sessionId 
              ? { ...get().activeSession, ...response.data }
              : get().activeSession
          });
          
          return response.data;
        } catch (error) {
          console.error('Error al verificar estado de sesión:', error);
          return null;
        }
      },
      
      logoutSession: async (phoneNumber) => {
        try {
          set({ isLoading: true, error: null });
          await whatsappService.logout(phoneNumber);
          
          const updatedSessions = get().sessions.map(session => 
            session.phoneNumber === phoneNumber 
              ? { ...session, status: 'logged_out' } 
              : session
          );
          
          set({ 
            sessions: updatedSessions,
            activeSession: get().activeSession?.phoneNumber === phoneNumber 
              ? null 
              : get().activeSession,
            isLoading: false
          });
          
          return true;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || error.message, 
            isLoading: false 
          });
          throw error;
        }
      },
      
      // Gestión de chats
      loadChats: async (phoneNumber, options = {}) => {
        try {
          set({ isLoading: true, error: null });
          const response = await whatsappService.getChats(phoneNumber, options);
          set({ chats: response.data.data, isLoading: false });
          return response.data;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || error.message, 
            isLoading: false 
          });
          throw error;
        }
      },
      
      setActiveChat: (chat) => set({ activeChat: chat }),
      
      syncChats: async (phoneNumber) => {
        try {
          set({ isLoading: true, error: null });
          await whatsappService.syncChats(phoneNumber);
          // Recargar chats después de sincronizar
          const response = await whatsappService.getChats(phoneNumber);
          set({ chats: response.data.data, isLoading: false });
          return true;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || error.message, 
            isLoading: false 
          });
          throw error;
        }
      },
      
      // Gestión de mensajes
      loadMessages: async (phoneNumber, chatId, options = {}) => {
        try {
          set({ isLoading: true, error: null });
          const response = await whatsappService.getChatMessages(phoneNumber, chatId, options);
          
          // Actualizar mensajes para este chat
          set(state => ({ 
            messages: { 
              ...state.messages, 
              [chatId]: response.data.data 
            },
            isLoading: false
          }));
          
          return response.data;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || error.message, 
            isLoading: false 
          });
          throw error;
        }
      },
      
      sendMessage: async (phoneNumber, chatId, message) => {
        try {
          set({ isLoading: true, error: null });
          const response = await whatsappService.sendMessage(phoneNumber, chatId, message);
          
          // Añadir mensaje enviado a la lista de mensajes
          if (get().messages[chatId]) {
            set(state => ({
              messages: {
                ...state.messages,
                [chatId]: [...state.messages[chatId], response.data]
              }
            }));
          }
          
          set({ isLoading: false });
          return response.data;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || error.message, 
            isLoading: false 
          });
          throw error;
        }
      },
      
      sendMediaMessage: async (phoneNumber, chatId, file, caption) => {
        try {
          set({ isLoading: true, error: null });
          
          // Crear FormData para envío de archivo
          const formData = new FormData();
          formData.append('file', file);
          formData.append('caption', caption || '');
          
          const response = await whatsappService.sendMediaMessage(phoneNumber, chatId, formData);
          
          // Añadir mensaje enviado a la lista de mensajes
          if (get().messages[chatId]) {
            set(state => ({
              messages: {
                ...state.messages,
                [chatId]: [...state.messages[chatId], response.data]
              }
            }));
          }
          
          set({ isLoading: false });
          return response.data;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || error.message, 
            isLoading: false 
          });
          throw error;
        }
      },
      
      // Gestión de contactos
      loadContacts: async (phoneNumber, options = {}) => {
        try {
          set({ isLoading: true, error: null });
          const response = await whatsappService.getContacts(phoneNumber, options);
          set({ contacts: response.data.data, isLoading: false });
          return response.data;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || error.message, 
            isLoading: false 
          });
          throw error;
        }
      },
      
      syncContacts: async (phoneNumber) => {
        try {
          set({ isLoading: true, error: null });
          await whatsappService.syncContacts(phoneNumber);
          // Recargar contactos después de sincronizar
          const response = await whatsappService.getContacts(phoneNumber);
          set({ contacts: response.data.data, isLoading: false });
          return true;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || error.message, 
            isLoading: false 
          });
          throw error;
        }
      },
      
      // UI controls
      toggleSessionManager: (isOpen = null) => 
        set({ isSessionManagerOpen: isOpen === null ? !get().isSessionManagerOpen : isOpen }),
      
      // Reset de errores
      clearError: () => set({ error: null }),
    }),
    {
      name: 'whatsapp-store',
      partialize: (state) => ({
        activeSession: state.activeSession,
        sessions: state.sessions
      }),
    }
  )
); 