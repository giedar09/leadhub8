import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import WhatsappService from './services/whatsapp.js';

// Configuración de variables de entorno
dotenv.config();

// Configuración de Express
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Obtener la ruta del directorio actual
const __dirname = dirname(fileURLToPath(import.meta.url));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leadhub8', {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
})
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => {
    console.error('Error conectando a MongoDB:', err);
    console.log('ADVERTENCIA: Continuando sin MongoDB. Las funcionalidades de WhatsApp estarán limitadas.');
  });

// Inicializar el servicio de WhatsApp
const whatsappService = new WhatsappService(io);

// Iniciar el servicio solo si MongoDB está conectado
mongoose.connection.once('open', () => {
  console.log('MongoDB conectado, iniciando servicio de WhatsApp...');
  whatsappService.init().catch(err => {
    console.error('Error al inicializar el servicio de WhatsApp:', err);
  });
});

// Rutas básicas
app.get('/', (req, res) => {
  res.send('API de Leadhub8 - CRM + WhatsApp');
});

// Ruta para verificar estado de WhatsApp
app.get('/api/whatsapp/status', (req, res) => {
  const clientCount = whatsappService.clients ? whatsappService.clients.size : 0;
  res.json({
    status: 'running',
    clientsCount: clientCount,
    mongodbConnected: mongoose.connection.readyState === 1
  });
});

// Ruta para iniciar una nueva sesión de WhatsApp
app.post('/api/whatsapp/session', async (req, res) => {
  try {
    const { phoneNumber, name } = req.body;
    
    if (!phoneNumber || !name) {
      return res.status(400).json({ error: 'Se requiere phoneNumber y name' });
    }
    
    // Verificar si ya existe una sesión con ese número
    const WhatsappSession = mongoose.model('WhatsappSession');
    let session = await WhatsappSession.findOne({ phoneNumber });
    
    if (!session) {
      // Crear nueva sesión
      session = new WhatsappSession({
        phoneNumber,
        name,
        isActive: true,
        status: 'disconnected'
      });
      await session.save();
    } else {
      // Actualizar sesión existente
      session.isActive = true;
      session.name = name;
      await session.save();
    }
    
    // Iniciar cliente de WhatsApp
    try {
      await whatsappService.initClient(phoneNumber, session._id);
      res.json({
        success: true,
        sessionId: session._id,
        message: 'Sesión iniciada. Espere el código QR en los eventos de socket.io'
      });
    } catch (error) {
      res.status(500).json({ error: `Error al iniciar cliente: ${error.message}` });
    }
  } catch (error) {
    console.error('Error al crear sesión:', error);
    res.status(500).json({ error: 'Error al crear la sesión de WhatsApp' });
  }
});

// Ruta para obtener QR de una sesión
app.get('/api/whatsapp/session/:phoneNumber/qr', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    // Buscar sesión en la base de datos
    const WhatsappSession = mongoose.model('WhatsappSession');
    const session = await WhatsappSession.findOne({ phoneNumber });
    
    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    if (session.qrCode) {
      return res.json({ 
        qrCode: session.qrCode,
        status: session.status,
        timestamp: session.qrTimestamp
      });
    } else {
      return res.status(404).json({ error: 'Código QR no disponible aún' });
    }
  } catch (error) {
    console.error('Error al obtener QR:', error);
    res.status(500).json({ error: 'Error al obtener código QR' });
  }
});

// Configuración de Socket.IO
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Manejar suscripción a eventos de WhatsApp
  socket.on('whatsapp:subscribe', async (phoneNumber) => {
    // Unirse a una sala específica para este número
    socket.join(`whatsapp:${phoneNumber}`);
    console.log(`Cliente ${socket.id} suscrito a eventos de WhatsApp para ${phoneNumber}`);
    
    // Enviar estado actual si hay una sesión
    try {
      const WhatsappSession = mongoose.model('WhatsappSession');
      const session = await WhatsappSession.findOne({ phoneNumber });
      
      if (session) {
        socket.emit('whatsapp:session:status', {
          phoneNumber,
          status: session.status,
          qrCode: session.qrCode,
          qrTimestamp: session.qrTimestamp,
          deviceInfo: session.deviceInfo
        });
      }
    } catch (error) {
      console.error(`Error al enviar estado de sesión a ${socket.id}:`, error);
    }
  });
  
  // Cancelar suscripción
  socket.on('whatsapp:unsubscribe', (phoneNumber) => {
    socket.leave(`whatsapp:${phoneNumber}`);
    console.log(`Cliente ${socket.id} canceló suscripción a eventos de WhatsApp para ${phoneNumber}`);
  });
  
  // Iniciar una nueva sesión
  socket.on('whatsapp:init', async (data) => {
    try {
      const { phoneNumber, name } = data;
      
      if (!phoneNumber || !name) {
        socket.emit('whatsapp:error', { error: 'Se requiere phoneNumber y name' });
        return;
      }
      
      // Verificar si ya existe una sesión
      const WhatsappSession = mongoose.model('WhatsappSession');
      let session = await WhatsappSession.findOne({ phoneNumber });
      
      if (!session) {
        // Crear nueva sesión
        session = new WhatsappSession({
          phoneNumber,
          name,
          isActive: true,
          status: 'disconnected'
        });
        await session.save();
      } else {
        // Actualizar sesión existente
        session.isActive = true;
        session.name = name;
        await session.save();
      }
      
      // Iniciar cliente de WhatsApp
      try {
        await whatsappService.initClient(phoneNumber, session._id);
        
        // Unirse a la sala para recibir eventos
        socket.join(`whatsapp:${phoneNumber}`);
        
        socket.emit('whatsapp:init:success', {
          phoneNumber,
          sessionId: session._id,
          status: 'connecting'
        });
      } catch (error) {
        socket.emit('whatsapp:init:error', { error: error.message });
      }
    } catch (error) {
      console.error('Error al iniciar sesión de WhatsApp:', error);
      socket.emit('whatsapp:error', { error: 'Error al iniciar la sesión de WhatsApp' });
    }
  });
  
  // Desconectar usuario
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Configurar el servicio de WhatsApp para enviar eventos a través de Socket.IO
whatsappService.eventHandler = (eventName, payload) => {
  if (payload && payload.phoneNumber) {
    // Emitir evento a la sala específica de este número de teléfono
    io.to(`whatsapp:${payload.phoneNumber}`).emit(`whatsapp:${eventName}`, payload);
  } else {
    // Eventos globales
    io.emit(`whatsapp:${eventName}`, payload);
  }
};

// Puerto
const PORT = process.env.PORT || 3000;

// Función para iniciar el servidor
const startServer = (port) => {
  server.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Puerto ${port} ocupado, intentando con el puerto ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Error al iniciar el servidor:', err);
    }
  });
};

// Iniciar servidor con reintento automático de puertos
startServer(PORT); 