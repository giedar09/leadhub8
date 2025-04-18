import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const { token } = useAuthStore();

  // Establecer conexión con Socket.IO
  useEffect(() => {
    // URL del servidor y opciones
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    // Solo conectar si hay un token
    if (token) {
      // Inicializar socket con opciones
      socketRef.current = io(socketUrl, {
        auth: { token },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Manejadores de eventos
      const onConnect = () => {
        console.log('Socket conectado');
        setIsConnected(true);
      };

      const onDisconnect = (reason) => {
        console.log(`Socket desconectado: ${reason}`);
        setIsConnected(false);
      };

      const onMessage = (message) => {
        console.log('Mensaje recibido:', message);
        setLastMessage(message);
      };

      const onConnectError = (error) => {
        console.error('Error de conexión:', error);
      };

      // Registrar eventos
      socketRef.current.on('connect', onConnect);
      socketRef.current.on('disconnect', onDisconnect);
      socketRef.current.on('message', onMessage);
      socketRef.current.on('connect_error', onConnectError);

      // Limpiar al desmontar
      return () => {
        if (socketRef.current) {
          socketRef.current.off('connect', onConnect);
          socketRef.current.off('disconnect', onDisconnect);
          socketRef.current.off('message', onMessage);
          socketRef.current.off('connect_error', onConnectError);
          socketRef.current.disconnect();
        }
      };
    }
    
    return () => {}; // Retorno vacío si no hay token
  }, [token]);

  // Enviar mensaje a través del socket
  const sendMessage = useCallback((event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
      return true;
    }
    return false;
  }, [isConnected]);

  // Suscribirse a un evento
  const subscribe = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      return () => socketRef.current.off(event, callback);
    }
    return () => {};
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    lastMessage,
    sendMessage,
    subscribe
  };
}; 