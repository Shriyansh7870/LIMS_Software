# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/

# ---- Development ----
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# ---- Builder ----
FROM base AS builder
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Production ----
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma/
EXPOSE 3001
CMD ["node", "dist/server.js"]
