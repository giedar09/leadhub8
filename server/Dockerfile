FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Crea directorio para uploads si no existe
RUN mkdir -p uploads

EXPOSE 3000

CMD ["npm", "run", "dev"] 