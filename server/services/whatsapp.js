import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import qrcode from 'qrcode';
import mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import axios from 'axios';

// Modelos
import WhatsappSession from '../models/WhatsappSession.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Contact from '../models/Contact.js';

// Configuración
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');
const SESSION_DIR = path.join(__dirname, '../../.wwebjs_auth');

// Asegurarse de que existen los directorios necesarios
const ensureDirectoriesExist = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch (error) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
  
  try {
    await fs.access(SESSION_DIR);
  } catch (error) {
    await fs.mkdir(SESSION_DIR, { recursive: true });
  }
};

// Clase principal para gestionar las sesiones de WhatsApp
class WhatsappService {
  constructor() {
    this.clients = new Map(); // Almacenar instancias de clientes por número
    this.eventHandlers = {}; // Manejadores de eventos personalizados
    
    // Inicializar directorios
    ensureDirectoriesExist();
    
    // Cargar sesiones almacenadas al inicio
    this.loadSessions();
  }
  
  // Cargar todas las sesiones activas desde la base de datos
  async loadSessions() {
    try {
      const sessions = await WhatsappSession.find({ isActive: true });
      console.log(`Encontradas ${sessions.length} sesiones activas de WhatsApp`);
      
      // Inicializar cada sesión
      for (const session of sessions) {
        await this.initClient(session.phoneNumber, session._id);
      }
    } catch (error) {
      console.error('Error al cargar sesiones de WhatsApp:', error);
    }
  }
  
  // Inicializar cliente de WhatsApp para un número específico
  async initClient(phoneNumber, sessionId = null) {
    try {
      // Si ya existe un cliente para este número, lo devolvemos
      if (this.clients.has(phoneNumber)) {
        return this.clients.get(phoneNumber);
      }
      
      // Buscar o crear la sesión en la BD
      let session = null;
      if (sessionId) {
        session = await WhatsappSession.findById(sessionId);
      } else {
        session = await WhatsappSession.findOne({ phoneNumber });
      }
      
      if (!session) {
        throw new Error(`No se encontró la sesión para el número ${phoneNumber}`);
      }
      
      // Actualizar el estado de la sesión
      await session.updateStatus('connecting');
      
      // Configurar opciones del cliente
      const clientOptions = {
        authStrategy: new LocalAuth({
          clientId: `session-${phoneNumber}`,
          dataPath: SESSION_DIR
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        },
        qrMaxRetries: 5,
        qrTimeoutMs: 30000,
        takeoverOnConflict: true,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      };
      
      // Crear nuevo cliente
      const client = new Client(clientOptions);
      
      // Registrar eventos del cliente
      this._registerClientEvents(client, phoneNumber, session);
      
      // Inicializar cliente
      await client.initialize();
      
      // Almacenar cliente en el mapa de clientes
      this.clients.set(phoneNumber, {
        client,
        sessionId: session._id,
        phoneNumber,
        status: 'connecting'
      });
      
      return this.clients.get(phoneNumber);
    } catch (error) {
      console.error(`Error al inicializar cliente WhatsApp para ${phoneNumber}:`, error);
      if (sessionId) {
        const session = await WhatsappSession.findById(sessionId);
        if (session) {
          await session.updateStatus('error', error.message);
        }
      }
      throw error;
    }
  }
  
  // Registrar eventos del cliente de WhatsApp
  _registerClientEvents(client, phoneNumber, session) {
    // Evento de generación de QR
    client.on('qr', async (qrData) => {
      try {
        // Convertir QR a imagen base64
        const qrImage = await qrcode.toDataURL(qrData);
        // Actualizar QR en la base de datos
        await session.updateQR(qrImage);
        
        // Emitir evento personalizado de QR
        this._emitEvent('qr', {
          phoneNumber,
          sessionId: session._id,
          qrImage,
          timestamp: new Date()
        });
        
        console.log(`QR generado para ${phoneNumber}`);
      } catch (error) {
        console.error(`Error al procesar QR para ${phoneNumber}:`, error);
      }
    });
    
    // Evento de autenticación
    client.on('authenticated', async () => {
      try {
        await session.updateStatus('authenticated');
        
        this._emitEvent('authenticated', {
          phoneNumber,
          sessionId: session._id,
          timestamp: new Date()
        });
        
        console.log(`Cliente WhatsApp autenticado para ${phoneNumber}`);
      } catch (error) {
        console.error(`Error al procesar autenticación para ${phoneNumber}:`, error);
      }
    });
    
    // Evento de conexión lista
    client.on('ready', async () => {
      try {
        // Actualizar estado e información del dispositivo
        const deviceInfo = client.info;
        await session.updateStatus('connected');
        await session.updateDeviceInfo({
          platform: deviceInfo?.platform || 'unknown',
          name: deviceInfo?.pushname || phoneNumber,
          version: deviceInfo?.phone?.wa_version || 'unknown'
        });
        
        // Emitir evento personalizado
        this._emitEvent('ready', {
          phoneNumber,
          sessionId: session._id,
          deviceInfo,
          timestamp: new Date()
        });
        
        console.log(`Cliente WhatsApp listo para ${phoneNumber}`);
        
        // Sincronizar chats inmediatamente después de la conexión
        this.syncChats(phoneNumber);
      } catch (error) {
        console.error(`Error al procesar evento ready para ${phoneNumber}:`, error);
      }
    });
    
    // Evento de desconexión
    client.on('disconnected', async (reason) => {
      try {
        await session.updateStatus('disconnected');
        
        this._emitEvent('disconnected', {
          phoneNumber,
          sessionId: session._id,
          reason,
          timestamp: new Date()
        });
        
        console.log(`Cliente WhatsApp desconectado para ${phoneNumber}: ${reason}`);
        
        // Eliminar cliente de la lista
        this.clients.delete(phoneNumber);
      } catch (error) {
        console.error(`Error al procesar desconexión para ${phoneNumber}:`, error);
      }
    });
    
    // Evento de recepción de mensaje
    client.on('message', async (msg) => {
      try {
        // Solo procesar mensajes que no son de nosotros mismos
        if (msg.fromMe) return;
        
        // Procesar el mensaje
        await this._processIncomingMessage(client, msg, phoneNumber, session);
      } catch (error) {
        console.error(`Error al procesar mensaje entrante para ${phoneNumber}:`, error);
      }
    });
    
    // Evento de cambio de estado de mensajes
    client.on('message_ack', async (msg, ack) => {
      try {
        // Mapear estado ACK de whatsapp-web.js a nuestro modelo
        const statusMap = {
          0: 'sending', // mensaje enviado al servidor pero no recibido por WhatsApp
          1: 'sent',    // mensaje recibido por WhatsApp
          2: 'delivered', // mensaje entregado al destinatario
          3: 'read'     // mensaje leído por el destinatario
        };
        
        const status = statusMap[ack] || 'sent';
        
        // Actualizar estado del mensaje en la base de datos
        const message = await Message.findOne({ messageId: msg.id.id });
        if (message) {
          await message.updateStatus(status);
          
          // Emitir evento de cambio de estado
          this._emitEvent('message_status', {
            phoneNumber,
            sessionId: session._id,
            messageId: msg.id.id,
            status,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error(`Error al procesar ACK de mensaje para ${phoneNumber}:`, error);
      }
    });
    
    // Evento de error
    client.on('auth_failure', async (error) => {
      try {
        await session.updateStatus('error', error.message);
        
        this._emitEvent('auth_failure', {
          phoneNumber,
          sessionId: session._id,
          error: error.message,
          timestamp: new Date()
        });
        
        console.error(`Error de autenticación para ${phoneNumber}:`, error);
        
        // Eliminar cliente de la lista
        this.clients.delete(phoneNumber);
      } catch (err) {
        console.error(`Error al procesar auth_failure para ${phoneNumber}:`, err);
      }
    });
  }
  
  // Procesar mensaje entrante
  async _processIncomingMessage(client, msg, phoneNumber, session) {
    try {
      // Obtener información del chat
      const chat = await msg.getChat();
      
      // Crear o actualizar información del chat en la base de datos
      const chatData = await this._getOrCreateChat(chat, phoneNumber);
      
      // Almacenar el mensaje en la base de datos
      const savedMessage = await this._saveMessage(msg, chatData, phoneNumber);
      
      // Actualizar estadísticas de la sesión
      await session.messageReceived();
      
      // Emitir evento de mensaje nuevo
      this._emitEvent('message', {
        phoneNumber,
        sessionId: session._id,
        messageId: savedMessage._id,
        chatId: chatData._id,
        message: savedMessage,
        timestamp: new Date()
      });
      
      return savedMessage;
    } catch (error) {
      console.error('Error al procesar mensaje entrante:', error);
      throw error;
    }
  }
  
  // Obtener o crear chat en la base de datos
  async _getOrCreateChat(chat, phoneNumber) {
    try {
      // Convertir JID a formato canónico para usar como chatId
      const chatId = chat.id._serialized;
      
      // Buscar chat existente
      let chatData = await Chat.findOne({ chatId });
      
      if (!chatData) {
        // Crear nuevo chat si no existe
        chatData = new Chat({
          chatId,
          whatsappNumber: phoneNumber,
          name: chat.name || chat.id.user,
          phoneNumber: chat.isGroup ? null : chat.id.user,
          isGroup: chat.isGroup,
          profilePicUrl: null // Se actualizará más tarde
        });
        
        await chatData.save();
        
        // Intentar obtener imagen de perfil
        try {
          const profilePic = await chat.getProfilePicUrl();
          if (profilePic) {
            chatData.profilePicUrl = profilePic;
            await chatData.save();
          }
        } catch (picError) {
          console.warn(`No se pudo obtener la imagen de perfil para ${chatId}`);
        }
      }
      
      return chatData;
    } catch (error) {
      console.error('Error al obtener/crear chat:', error);
      throw error;
    }
  }
  
  // Guardar mensaje en la base de datos
  async _saveMessage(msg, chat, phoneNumber) {
    try {
      // Determinar tipo de mensaje
      let messageType = 'text';
      let mediaUrl = null;
      let mediaPath = null;
      let mediaData = null;
      let mediaSize = 0;
      let mediaMimetype = null;
      
      // Procesar media si existe
      if (msg.hasMedia) {
        messageType = msg.type;
        
        // Descargar y guardar el archivo multimedia
        const media = await msg.downloadMedia();
        if (media) {
          const mediaResult = await this._saveMedia(media, phoneNumber);
          mediaUrl = mediaResult.url;
          mediaPath = mediaResult.path;
          mediaSize = mediaResult.size;
          mediaMimetype = media.mimetype;
          mediaData = {
            filename: mediaResult.filename,
            mimetype: media.mimetype,
            size: mediaResult.size
          };
        }
      }
      
      // Guardar mensaje en la base de datos
      const message = new Message({
        messageId: msg.id.id,
        chatId: chat._id,
        whatsappNumber: phoneNumber,
        type: messageType,
        content: msg.body,
        fromMe: msg.fromMe,
        timestamp: msg.timestamp * 1000, // Convertir a milisegundos
        sender: msg.fromMe ? phoneNumber : msg._data.notifyName || msg.author,
        senderJid: msg.author || phoneNumber,
        media: mediaData ? {
          url: mediaUrl,
          path: mediaPath,
          mimetype: mediaMimetype,
          size: mediaSize
        } : null,
        status: 'received',
        metadata: {
          rawData: JSON.stringify(msg._data)
        }
      });
      
      await message.save();
      
      // Actualizar fecha del último mensaje en el chat
      chat.lastMessageAt = new Date(msg.timestamp * 1000);
      chat.lastMessageId = message._id;
      await chat.save();
      
      return message;
    } catch (error) {
      console.error('Error al guardar mensaje:', error);
      throw error;
    }
  }
  
  // Guardar archivo multimedia
  async _saveMedia(media, phoneNumber) {
    try {
      if (!media || !media.data) {
        throw new Error('Media inválido o vacío');
      }
      
      // Generar nombre de archivo único
      const fileExt = mime.extension(media.mimetype) || 'bin';
      const filename = `${uuidv4()}.${fileExt}`;
      const relativePath = path.join(phoneNumber, filename);
      const fullPath = path.join(UPLOAD_DIR, relativePath);
      
      // Asegurar que existe el directorio para este número
      const phoneDir = path.join(UPLOAD_DIR, phoneNumber);
      await fs.mkdir(phoneDir, { recursive: true });
      
      // Guardar archivo
      const buffer = Buffer.from(media.data, 'base64');
      await fs.writeFile(fullPath, buffer);
      
      // Crear URL relativa
      const url = `/uploads/${phoneNumber}/${filename}`;
      
      return {
        path: relativePath,
        url,
        filename,
        size: buffer.length
      };
    } catch (error) {
      console.error('Error al guardar archivo multimedia:', error);
      throw error;
    }
  }
  
  // Emitir eventos para integración con sistemas externos
  _emitEvent(eventName, payload) {
    // Implementar sistema de eventos (ejemplo: EventEmitter, Socket.io, etc.)
    if (this.eventHandler && typeof this.eventHandler === 'function') {
      this.eventHandler(eventName, payload);
    }
  }
  
  // Sincronizar chats desde WhatsApp
  async syncChats(phoneNumber) {
    try {
      const client = this.clients.get(phoneNumber);
      if (!client) {
        throw new Error(`No hay cliente activo para ${phoneNumber}`);
      }
      
      // Obtener todos los chats
      const chats = await client.getChats();
      console.log(`Sincronizando ${chats.length} chats para ${phoneNumber}`);
      
      // Procesar cada chat
      for (const chat of chats) {
        await this._getOrCreateChat(chat, phoneNumber);
      }
      
      return true;
    } catch (error) {
      console.error(`Error al sincronizar chats para ${phoneNumber}:`, error);
      throw error;
    }
  }
  
  // Obtener cliente de WhatsApp para un número específico
  getClient(phoneNumber) {
    const client = this.clients.get(phoneNumber);
    if (!client) {
      throw new Error(`No hay cliente activo para ${phoneNumber}`);
    }
    return client;
  }
  
  // Enviar mensaje de texto
  async sendTextMessage(phoneNumber, to, text) {
    try {
      const client = this.getClient(phoneNumber);
      const session = await WhatsappSession.findOne({ phoneNumber });
      
      if (!session) {
        throw new Error(`No se encontró la sesión para ${phoneNumber}`);
      }
      
      // Normalizar número de destino
      const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
      
      // Enviar mensaje
      const response = await client.sendMessage(chatId, text);
      
      // Obtener o crear chat
      const chat = await client.getChatById(chatId);
      const chatData = await this._getOrCreateChat(chat, phoneNumber);
      
      // Guardar mensaje en la base de datos
      const message = new Message({
        messageId: response.id.id,
        chatId: chatData._id,
        whatsappNumber: phoneNumber,
        type: 'text',
        content: text,
        fromMe: true,
        timestamp: Date.now(),
        sender: phoneNumber,
        senderJid: phoneNumber,
        status: 'sent',
        metadata: {
          rawData: JSON.stringify(response._data)
        }
      });
      
      await message.save();
      
      // Actualizar chat
      chatData.lastMessageAt = new Date();
      chatData.lastMessageId = message._id;
      await chatData.save();
      
      // Actualizar estadísticas de la sesión
      await session.messageSent();
      
      return message;
    } catch (error) {
      console.error(`Error al enviar mensaje de texto desde ${phoneNumber} a ${to}:`, error);
      throw error;
    }
  }
  
  // Enviar archivo multimedia
  async sendMediaMessage(phoneNumber, to, mediaPath, caption = '') {
    try {
      const client = this.getClient(phoneNumber);
      const session = await WhatsappSession.findOne({ phoneNumber });
      
      if (!session) {
        throw new Error(`No se encontró la sesión para ${phoneNumber}`);
      }
      
      // Normalizar número de destino
      const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
      
      // Leer archivo
      let mediaBuffer;
      let mediaMimetype;
      
      // Si es una URL local, leer desde el sistema de archivos
      if (mediaPath.startsWith('/uploads/')) {
        const localPath = path.join(process.cwd(), 'public', mediaPath);
        mediaBuffer = await fs.readFile(localPath);
        mediaMimetype = mime.lookup(localPath) || 'application/octet-stream';
      } else {
        // Si es una URL externa, descargar (implementación simplificada)
        // Aquí debería agregarse lógica para descargar archivos externos
        throw new Error('URLs externas no implementadas');
      }
      
      // Crear objeto de media para WhatsApp
      const media = new MessageMedia(
        mediaMimetype,
        mediaBuffer.toString('base64'),
        path.basename(mediaPath)
      );
      
      // Enviar mensaje
      const response = await client.sendMessage(chatId, media, { caption });
      
      // Obtener o crear chat
      const chat = await client.getChatById(chatId);
      const chatData = await this._getOrCreateChat(chat, phoneNumber);
      
      // Determinar tipo de mensaje basado en MIME
      let messageType = 'document';
      if (mediaMimetype.startsWith('image/')) messageType = 'image';
      else if (mediaMimetype.startsWith('video/')) messageType = 'video';
      else if (mediaMimetype.startsWith('audio/')) messageType = 'audio';
      
      // Guardar mensaje en la base de datos
      const message = new Message({
        messageId: response.id.id,
        chatId: chatData._id,
        whatsappNumber: phoneNumber,
        type: messageType,
        content: caption,
        fromMe: true,
        timestamp: Date.now(),
        sender: phoneNumber,
        senderJid: phoneNumber,
        media: {
          url: mediaPath,
          mimetype: mediaMimetype,
          size: mediaBuffer.length
        },
        status: 'sent',
        metadata: {
          rawData: JSON.stringify(response._data)
        }
      });
      
      await message.save();
      
      // Actualizar chat
      chatData.lastMessageAt = new Date();
      chatData.lastMessageId = message._id;
      await chatData.save();
      
      // Actualizar estadísticas de la sesión
      await session.messageSent();
      
      return message;
    } catch (error) {
      console.error(`Error al enviar mensaje multimedia desde ${phoneNumber} a ${to}:`, error);
      throw error;
    }
  }
  
  // Cerrar sesión de WhatsApp
  async logout(phoneNumber) {
    try {
      const client = this.getClient(phoneNumber);
      const session = await WhatsappSession.findOne({ phoneNumber });
      
      if (!session) {
        throw new Error(`No se encontró la sesión para ${phoneNumber}`);
      }
      
      // Actualizar estado de la sesión
      session.status = 'logging_out';
      await session.save();
      
      // Cerrar sesión en WhatsApp
      await client.logout();
      
      // Eliminar cliente de la lista
      this.clients.delete(phoneNumber);
      
      // Actualizar estado final en la base de datos
      session.status = 'logged_out';
      session.lastDisconnectedAt = new Date();
      await session.save();
      
      return { success: true, message: 'Sesión cerrada correctamente' };
    } catch (error) {
      console.error(`Error al cerrar sesión de ${phoneNumber}:`, error);
      
      // Intentar actualizar estado en caso de error
      try {
        const session = await WhatsappSession.findOne({ phoneNumber });
        if (session) {
          session.status = 'error';
          session.lastError = error.message;
          await session.save();
        }
      } catch (dbError) {
        console.error('Error al actualizar estado de sesión:', dbError);
      }
      
      throw error;
    }
  }
  
  // Obtener información del cliente
  async getClientInfo(phoneNumber) {
    try {
      const client = this.getClient(phoneNumber);
      const info = await client.getWid();
      const state = await client.getState();
      
      return {
        id: info,
        phoneNumber,
        connected: state === 'CONNECTED',
        state
      };
    } catch (error) {
      console.error(`Error al obtener información del cliente ${phoneNumber}:`, error);
      throw error;
    }
  }
  
  // Obtener chats del usuario
  async getChats(phoneNumber, options = {}) {
    try {
      const { limit = 50, offset = 0, search = '', includeMessages = false } = options;
      
      // Buscar chats en la base de datos
      let query = { whatsappNumber: phoneNumber };
      
      // Añadir búsqueda si se especifica
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Obtener cantidad total
      const total = await Chat.countDocuments(query);
      
      // Obtener chats con paginación
      let chatsQuery = Chat.find(query)
        .sort({ lastMessageAt: -1 })
        .skip(offset)
        .limit(limit);
        
      // Incluir último mensaje si se solicita
      if (includeMessages) {
        chatsQuery = chatsQuery.populate('lastMessageId');
      }
      
      const chats = await chatsQuery.exec();
      
      return {
        data: chats,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + chats.length < total
        }
      };
    } catch (error) {
      console.error(`Error al obtener chats para ${phoneNumber}:`, error);
      throw error;
    }
  }
  
  // Obtener mensajes de un chat específico
  async getChatMessages(phoneNumber, chatId, options = {}) {
    try {
      const { limit = 50, before = null, includeMedia = true } = options;
      
      // Buscar chat para verificar que pertenece al usuario
      const chat = await Chat.findOne({
        _id: chatId,
        whatsappNumber: phoneNumber
      });
      
      if (!chat) {
        throw new Error('Chat no encontrado o no pertenece a este usuario');
      }
      
      // Configurar consulta
      let query = {
        chatId,
        whatsappNumber: phoneNumber
      };
      
      // Si se especifica mensaje antes del cual buscar
      if (before) {
        const beforeMessage = await Message.findOne({ _id: before });
        if (beforeMessage) {
          query.timestamp = { $lt: beforeMessage.timestamp };
        }
      }
      
      // Obtener mensajes
      const messages = await Message.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();
      
      // Revertir para orden cronológico
      messages.reverse();
      
      return {
        data: messages,
        pagination: {
          limit,
          hasMore: messages.length === limit
        }
      };
    } catch (error) {
      console.error(`Error al obtener mensajes del chat ${chatId}:`, error);
      throw error;
    }
  }
  
  // Marcar chat como leído
  async markChatAsRead(phoneNumber, chatId) {
    try {
      const client = this.getClient(phoneNumber);
      
      // Buscar chat
      const chatData = await Chat.findOne({
        _id: chatId,
        whatsappNumber: phoneNumber
      });
      
      if (!chatData) {
        throw new Error('Chat no encontrado');
      }
      
      // Obtener chat de WhatsApp
      const chat = await client.getChatById(chatData.jid);
      
      // Marcar como leído
      await chat.sendSeen();
      
      // Actualizar estado en la base de datos
      chatData.unreadCount = 0;
      await chatData.save();
      
      return { success: true };
    } catch (error) {
      console.error(`Error al marcar chat como leído ${chatId}:`, error);
      throw error;
    }
  }
  
  // Obtener contactos
  async getContacts(phoneNumber, options = {}) {
    try {
      const { limit = 100, offset = 0, search = '' } = options;
      
      // Configurar consulta
      let query = { whatsappNumber: phoneNumber };
      
      // Añadir búsqueda si se especifica
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Obtener cantidad total
      const total = await Contact.countDocuments(query);
      
      // Obtener contactos con paginación
      const contacts = await Contact.find(query)
        .sort({ name: 1 })
        .skip(offset)
        .limit(limit)
        .exec();
      
      return {
        data: contacts,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + contacts.length < total
        }
      };
    } catch (error) {
      console.error(`Error al obtener contactos para ${phoneNumber}:`, error);
      throw error;
    }
  }
  
  // Sincronizar contactos
  async syncContacts(phoneNumber) {
    try {
      const client = this.getClient(phoneNumber);
      
      // Obtener todos los contactos
      const contacts = await client.getContacts();
      console.log(`Sincronizando ${contacts.length} contactos para ${phoneNumber}`);
      
      // Procesar cada contacto
      for (const contact of contacts) {
        // Ignorar contactos sin número o que no son contactos válidos
        if (!contact.number || !contact.isMyContact) continue;
        
        try {
          // Crear o actualizar contacto
          await Contact.findOneAndUpdate(
            { 
              phoneNumber: contact.number,
              whatsappNumber: phoneNumber
            },
            {
              $set: {
                name: contact.name || contact.pushname || contact.number,
                jid: contact.id._serialized,
                isGroup: contact.isGroup,
                isMyContact: contact.isMyContact,
                lastUpdated: new Date()
              }
            },
            { upsert: true, new: true }
          );
        } catch (contactError) {
          console.error(`Error al procesar contacto ${contact.number}:`, contactError);
        }
      }
      
      return { success: true, count: contacts.length };
    } catch (error) {
      console.error(`Error al sincronizar contactos para ${phoneNumber}:`, error);
      throw error;
    }
  }
  
  // Exportar historial de chat
  async exportChatHistory(phoneNumber, chatId, format = 'json') {
    try {
      // Verificar que el chat existe y pertenece al usuario
      const chat = await Chat.findOne({
        _id: chatId,
        whatsappNumber: phoneNumber
      });
      
      if (!chat) {
        throw new Error('Chat no encontrado o no pertenece a este usuario');
      }
      
      // Obtener todos los mensajes del chat
      const messages = await Message.find({
        chatId,
        whatsappNumber: phoneNumber
      }).sort({ timestamp: 1 });
      
      if (format === 'json') {
        return {
          chat: {
            id: chat._id,
            name: chat.name,
            phoneNumber: chat.phoneNumber,
            isGroup: chat.isGroup
          },
          messages: messages.map(msg => ({
            id: msg._id,
            type: msg.type,
            content: msg.content,
            fromMe: msg.fromMe,
            timestamp: msg.timestamp,
            sender: msg.sender,
            media: msg.media ? {
              url: msg.media.url,
              type: msg.media.mimetype
            } : null
          }))
        };
      } else if (format === 'txt') {
        // Formatear como texto plano
        let result = `Chat con: ${chat.name || chat.phoneNumber}\n`;
        result += `Fecha de exportación: ${new Date().toISOString()}\n\n`;
        
        messages.forEach(msg => {
          const date = new Date(msg.timestamp).toLocaleString();
          const sender = msg.fromMe ? 'Tú' : (msg.sender || 'Desconocido');
          result += `[${date}] ${sender}: ${msg.content}\n`;
          if (msg.media) {
            result += `[Media: ${msg.media.url}]\n`;
          }
          result += '\n';
        });
        
        return result;
      } else {
        throw new Error(`Formato no soportado: ${format}`);
      }
    } catch (error) {
      console.error(`Error al exportar historial del chat ${chatId}:`, error);
      throw error;
    }
  }
} 