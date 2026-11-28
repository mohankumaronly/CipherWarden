# Build Stage
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Runner Stage
FROM node:22-slim AS runner
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
# Install ALL deps (including prisma CLI) for migrate deploy
RUN npm ci
RUN npx prisma generate
# Copy only the built JS from the build stage
COPY --from=build /app/dist ./dist
COPY tsconfig.json ./
COPY src ./src
ENV NODE_ENV=production
EXPOSE 5000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
