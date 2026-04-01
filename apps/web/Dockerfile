# ── Build stage ────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json* ./
COPY packages/wealthspot-types ./packages/wealthspot-types
COPY apps/web ./apps/web

RUN npm install --legacy-peer-deps
RUN npm run build --workspace=apps/web

# ── Production: serve with nginx ──────────────────────────
FROM nginx:alpine AS production
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ── Dev stage: vite dev server ────────────────────────────
FROM node:20-alpine AS dev
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/wealthspot-types ./packages/wealthspot-types
COPY apps/web ./apps/web

RUN npm install --legacy-peer-deps
WORKDIR /app/apps/web
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
