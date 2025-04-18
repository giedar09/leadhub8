import mongoose from 'mongoose';

const whatsappSessionSchema = new mongoose.Schema({
  // Número de WhatsApp (con código de país)
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Nombre descriptivo para identificar este número
  name: {
    type: String,
    required: true
  },
  // Estado actual de la sesión
  status: {
    type: String,
    enum: ['disconnected', 'connecting', 'connected', 'authenticated', 'error'],
    default: 'disconnected'
  },
  // Datos de sesión (cifrados)
  sessionData: {
    type: String,
    default: null
  },
  // Para almacenar el QR en formato base64 durante la conexión
  qrCode: {
    type: String,
    default: null
  },
  // Última vez que se actualizó el QR
  qrTimestamp: {
    type: Date,
    default: null
  },
  // Información del dispositivo conectado
  deviceInfo: {
    platform: String,
    name: String,
    version: String
  },
  // Estadísticas
  stats: {
    messagesReceived: {
      type: Number,
      default: 0
    },
    messagesSent: {
      type: Number,
      default: 0
    },
    lastMessageAt: {
      type: Date,
      default: null
    },
    totalChats: {
      type: Number,
      default: 0
    }
  },
  // Si esta sesión está activa y debe auto-conectarse
  isActive: {
    type: Boolean,
    default: true
  },
  // Última conexión
  lastConnection: {
    type: Date,
    default: null
  },
  // Mensaje de error si lo hubiera
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Método para actualizar las estadísticas cuando se envía un mensaje
whatsappSessionSchema.methods.messageSent = function() {
  this.stats.messagesSent += 1;
  this.stats.lastMessageAt = new Date();
  return this.save();
};

// Método para actualizar las estadísticas cuando se recibe un mensaje
whatsappSessionSchema.methods.messageReceived = function() {
  this.stats.messagesReceived += 1;
  this.stats.lastMessageAt = new Date();
  return this.save();
};

// Método para actualizar el estado
whatsappSessionSchema.methods.updateStatus = function(newStatus, errorMsg = null) {
  this.status = newStatus;
  
  if (newStatus === 'connected' || newStatus === 'authenticated') {
    this.lastConnection = new Date();
    this.errorMessage = null;
    this.qrCode = null;
  } else if (newStatus === 'error') {
    this.errorMessage = errorMsg;
  }
  
  return this.save();
};

// Método para actualizar el QR
whatsappSessionSchema.methods.updateQR = function(qrCode) {
  this.qrCode = qrCode;
  this.qrTimestamp = new Date();
  this.status = 'connecting';
  return this.save();
};

// Método para guardar los datos de sesión
whatsappSessionSchema.methods.saveSession = function(sessionData) {
  this.sessionData = sessionData;
  return this.save();
};

// Método para actualizar la info del dispositivo
whatsappSessionSchema.methods.updateDeviceInfo = function(deviceInfo) {
  this.deviceInfo = deviceInfo;
  return this.save();
};

// Obtener datos básicos para la UI (omitiendo datos sensibles)
whatsappSessionSchema.methods.toBasicJSON = function() {
  return {
    id: this._id,
    phoneNumber: this.phoneNumber,
    name: this.name,
    status: this.status,
    qrCode: this.qrCode,
    qrTimestamp: this.qrTimestamp,
    deviceInfo: this.deviceInfo,
    stats: this.stats,
    isActive: this.isActive,
    lastConnection: this.lastConnection,
    errorMessage: this.errorMessage
  };
};

const WhatsappSession = mongoose.model('WhatsappSession', whatsappSessionSchema);

export default WhatsappSession; 