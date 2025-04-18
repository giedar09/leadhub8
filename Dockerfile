FROM node:18-alpine

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY ecosystem.config.js ./
COPY .env* ./

# Instalar PM2 globalmente
RUN npm install -g pm2

# Instalar dependencias principales
RUN npm install

# Copiar el código del servidor
COPY server ./server

# Instalar dependencias del servidor
RUN cd server && npm install

# Copiar la build del cliente (asume que ya fue compilado)
COPY client/dist ./client/dist

# Puerto para la API
EXPOSE 3000

# Iniciar con PM2 en modo production
CMD ["pm2-runtime", "ecosystem.config.js", "--env", "production"]