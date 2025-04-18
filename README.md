# Leadhub8 - CRM + WhatsApp

Sistema integrado de CRM con funcionalidades de WhatsApp para gestión de contactos, conversaciones y seguimiento de clientes.

## Tecnologías

### Backend
- Node.js + Express
- Socket.IO
- whatsapp-web.js
- MongoDB (con Mongoose)
- JWT para autenticación
- Multer (para archivos multimedia)
- Agenda.js (para tareas programadas)

### Frontend
- React + Vite
- TailwindCSS
- React Router
- Zustand (para estado global)
- React Query (para peticiones)
- react-hook-form + Zod (formularios)
- Day.js (manejo de fechas)
- Heroicons

## Instalación

### Requisitos previos
- Node.js (v16 o superior)
- MongoDB
- npm o yarn

### Configuración del entorno
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/leadhub8.git
cd leadhub8

# Copiar el archivo de variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

### Instalación de dependencias
```bash
# Instalar dependencias del proyecto principal
npm install

# Instalar dependencias del backend
cd server
npm install

# Instalar dependencias del frontend
cd ../client
npm install
```

### Ejecución en desarrollo
```bash
# Desde la raíz del proyecto, ejecutar backend y frontend
npm run dev

# O ejecutarlos por separado
npm run dev:server
npm run dev:client
```

## Estructura del proyecto
```
root/
├── client/                      # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layout/
│   │   ├── hooks/
│   │   ├── stores/              # Zustand
│   │   ├── utils/
│   │   ├── services/            # llamadas API
│   │   └── main.jsx
│   └── tailwind.config.js
│
├── server/                      # Backend Node
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── sockets/
│   ├── utils/
│   ├── jobs/                    # Mensajes programados
│   └── index.js
│
├── .env                         # Variables de entorno
└── README.md
```
