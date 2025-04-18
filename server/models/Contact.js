import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  // Número de WhatsApp al que pertenece este contacto
  whatsappNumber: {
    type: String,
    required: true,
    index: true
  },
  // Número del contacto
  phoneNumber: {
    type: String,
    required: true
  },
  // Nombre del contacto
  name: {
    type: String,
    required: true
  },
  // JID del contacto (ID único de WhatsApp)
  jid: {
    type: String,
    index: true
  },
  // Si es un grupo
  isGroup: {
    type: Boolean,
    default: false
  },
  // Si está en la lista de contactos del usuario
  isMyContact: {
    type: Boolean,
    default: true
  },
  // Metadatos adicionales para el CRM
  metadata: {
    // Empresa o compañía
    company: {
      type: String,
      default: null
    },
    // Correo electrónico
    email: {
      type: String,
      default: null
    },
    // Cargo o puesto
    position: {
      type: String,
      default: null
    },
    // Notas
    notes: {
      type: String,
      default: null
    },
    // Etiquetas personalizadas
    tags: [{
      type: String
    }],
    // URL de la foto de perfil
    profilePicUrl: {
      type: String,
      default: null
    },
    // Estado del contacto en el CRM
    status: {
      type: String,
      enum: ['prospecto', 'cliente', 'inactivo', 'otro'],
      default: 'prospecto'
    },
    // Campos personalizados
    customFields: {
      type: Map,
      of: String,
      default: () => new Map()
    }
  },
  // Última vez que se actualizó
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para búsquedas frecuentes
contactSchema.index({ whatsappNumber: 1, phoneNumber: 1 }, { unique: true });
contactSchema.index({ whatsappNumber: 1, name: 1 });
contactSchema.index({ 'metadata.tags': 1 });

// Método para formatear el contacto para la UI
contactSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  
  return obj;
};

const Contact = mongoose.model('Contact', contactSchema);

export default Contact; 