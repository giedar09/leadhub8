import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store para manejar el estado de autenticación
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      // Estado inicial
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Acciones
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          // Aquí iría la llamada a la API para autenticar al usuario
          // Por ahora, solo simulamos
          const response = { token: 'fake-token', user: { id: 1, name: 'Usuario', email: credentials.email, role: 'agent' } };
          
          set({
            token: response.token,
            user: response.user,
            isAuthenticated: true,
            isLoading: false
          });
          return response;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          error: null
        });
      },

      setUser: (user) => set({ user }),
      
      resetError: () => set({ error: null })
    }),
    {
      name: 'auth-storage', // nombre para localStorage
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
); 