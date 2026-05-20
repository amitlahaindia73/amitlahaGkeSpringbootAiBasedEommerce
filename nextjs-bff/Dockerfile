# ---------------------------------------------------------
# Stage 1: install dependencies
# ---------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

COPY nextjs-bff/package.json ./
RUN npm install

# ---------------------------------------------------------
# Stage 2: build Next.js app
# ---------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY nextjs-bff ./

RUN npm run build

# ---------------------------------------------------------
# Stage 3: production runtime for standalone output
# ---------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]