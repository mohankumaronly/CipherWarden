# Build Stage
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_API_BASE_URL is relative for Nginx proxy
ENV VITE_API_BASE_URL=/api/v1
RUN npm run build

# Runner Stage
FROM nginx:alpine AS runner
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
