# Basis-Image mit Node.js (aktuellere Version empfohlen)
FROM node:18

# Arbeitsverzeichnis im Container
WORKDIR /app

# Abhängigkeiten installieren
COPY package*.json ./
RUN npm install

# Source Code kopieren
COPY . .

# Prisma Client generieren
RUN npx prisma generate

# TypeScript build
RUN npm run build

# Production-only install (optional, schlanker)
RUN npm prune --production

# Start (aus dist/)
CMD ["node", "dist/index.js"]