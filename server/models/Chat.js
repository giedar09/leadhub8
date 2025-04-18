import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  // ID único para el chat (normalmente el JID de WhatsApp)
  chatId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Número de WhatsApp al que pertenece este chat
  whatsappNumber: {
    type: String,
    required: true,
    index: true
  },
  // Nombre del contacto/grupo
  name: {
    type: String,
    required: true
  },
  // Número de teléfono del contacto (solo para chats individuales)
  phoneNumber: {
    type: String,
    default: null
  },
  // URL de la imagen de perfil
  profilePicUrl: {
    type: String,
    default: null
  },
  // Si es un grupo de WhatsApp
  isGroup: {
    type: Boolean,
    default: false
  },
  // Si está archivado
  isArchived: {
    type: Boolean,
    default: false
  },
  // Timestamp del último mensaje
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  // ID del último mensaje
  lastMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  // Contador de mensajes no leídos
  unreadCount: {
    type: Number,
    default: 0
  },
  // Si está muted
  isMuted: {
    type: Boolean,
    default: false
  },
  // Metadatos adicionales para el CRM
  metadata: {
    // Estado del contacto en el CRM
    status: {
      type: String,
      enum: ['prospecto', 'cliente', 'inactivo', 'otro'],
      default: 'prospecto'
    },
    // Último estado visto
    lastSeen: {
      type: Date,
      default: null
    },
    // Etiquetas personalizadas
    tags: [{
      type: String
    }],
    // Datos adicionales de contacto
    contactInfo: {
      type: Map,
      of: String,
      default: () => new Map()
    }
  }
}, {
  timestamps: true
});

// Índices para búsquedas frecuentes
chatSchema.index({ whatsappNumber: 1, lastMessageAt: -1 });
chatSchema.index({ 'metadata.status': 1 });

// Método para actualizar lastMessage y contador de no leídos
chatSchema.methods.updateLastMessage = async function(messageId, isIncoming = false) {
  this.lastMessageId = messageId;
  this.lastMessageAt = Date.now();
  
  if (isIncoming) {
    this.unreadCount += 1;
  } else {
    // Si es un mensaje saliente, reiniciamos el contador de no leídos
    this.unreadCount = 0;
  }
  
  return this.save();
};

// Método para marcar todos los mensajes como leídos
chatSchema.methods.markAsRead = function() {
  this.unreadCount = 0;
  return this.save();
};

// Método para obtener los datos básicos del chat para la UI
chatSchema.methods.toBasicJSON = function() {
  return {
    id: this._id,
    chatId: this.chatId,
    whatsappNumber: this.whatsappNumber,
    name: this.name,
    phoneNumber: this.phoneNumber,
    profilePicUrl: this.profilePicUrl,
    isGroup: this.isGroup,
    isArchived: this.isArchived,
    lastMessageAt: this.lastMessageAt,
    unreadCount: this.unreadCount,
    isMuted: this.isMuted,
    status: this.metadata.status
  };
};

const Chat = mongoose.model('Chat', chatSchema);

export default Chat; 