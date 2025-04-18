import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  // ID único del mensaje de WhatsApp
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // ID del chat al que pertenece este mensaje (ref a JID)
  chatId: {
    type: String,
    required: true,
    index: true
  },
  // Número de WhatsApp que envió/recibió este mensaje
  whatsappNumber: {
    type: String,
    required: true
  },
  // Referencia al chat en nuestra DB
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  // Contenido del mensaje
  body: {
    type: String,
    default: ''
  },
  // Tipo de mensaje
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker', 'call', 'system', 'deleted'],
    required: true
  },
  // Si el mensaje fue enviado por nosotros o recibido
  fromMe: {
    type: Boolean,
    required: true,
    index: true
  },
  // Autor del mensaje (nombre o número)
  author: {
    type: String,
    required: true
  },
  // En caso de grupos, el número que envió el mensaje
  authorNumber: {
    type: String,
    default: null
  },
  // Timestamp de cuando se envió/recibió el mensaje
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  // Estado del mensaje (solo para mensajes enviados)
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sending'
  },
  // Si el mensaje fue eliminado
  isDeleted: {
    type: Boolean,
    default: false
  },
  // Si es una cita o respuesta a otro mensaje
  quotedMessageId: {
    type: String,
    default: null
  },
  quotedMessage: {
    id: String,
    body: String,
    type: String,
    author: String
  },
  // Datos para mensajes multimedia
  media: {
    // URL donde se almacena el archivo (puede ser local o remota)
    url: String,
    // Tipo MIME
    mimetype: String,
    // Nombre del archivo (para documentos)
    filename: String,
    // Tamaño en bytes
    size: Number,
    // Duración (para audio y video)
    duration: Number,
    // Caption o pie de la media
    caption: String,
    // Miniatura en base64 (si está disponible)
    thumbnail: String
  },
  // Para mensajes de ubicación
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  }
}, {
  timestamps: true
});

// Índices compuestos para consultas comunes
messageSchema.index({ chatId: 1, timestamp: 1 });
messageSchema.index({ whatsappNumber: 1, timestamp: 1 });

// Método para actualizar el estado del mensaje
messageSchema.methods.updateStatus = function(newStatus) {
  if (this.fromMe && ['sent', 'delivered', 'read', 'failed'].includes(newStatus)) {
    this.status = newStatus;
    return this.save();
  }
  return Promise.resolve(this);
};

// Método para marcar un mensaje como eliminado
messageSchema.methods.markAsDeleted = function() {
  this.isDeleted = true;
  // No borramos el contenido para mantener registro 
  // pero en la UI se mostrará como "Mensaje eliminado"
  return this.save();
};

// Método para formatear el mensaje para la UI
messageSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  
  // Formatear timestamp para la UI
  obj.formattedTime = new Date(obj.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return obj;
};

const Message = mongoose.model('Message', messageSchema);

export default Message; 