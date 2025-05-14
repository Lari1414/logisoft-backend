# Basis-Image
FROM node:18

# Arbeitsverzeichnis
WORKDIR /app

# Nur package.json + lockfile kopieren und Abhängigkeiten installieren
COPY package*.json ./
RUN npm install

# Prisma Client generieren (vor dem Build nötig)
COPY prisma ./prisma
RUN npx prisma generate

# Source Code kopieren
COPY . .

# TypeScript build
RUN npm run build

# Optional: Nur Production-Abhängigkeiten behalten
RUN npm prune --production

# App starten
CMD ["node", "dist/index.js"]