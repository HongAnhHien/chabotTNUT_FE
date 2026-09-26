# ---- PIAI-TNUT Frontend (Atlas · React + Vite) ----
# Build tĩnh rồi phục vụ bằng nginx. Không chạy Vite dev trên production.
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Model khuôn mặt (không có trong git) — tự tải + kiểm mã băm; sai thì dừng build
RUN sh scripts/fetch-face-models.sh

# Biến build của Vite (truyền từ docker-compose). API gọi cùng domain qua /api.
ARG VITE_API_BASE_URL=/api
ARG VITE_RIAT_ELEARNING_URL=
ARG VITE_GOOGLE_MAPS_API_KEY=
ARG VITE_ENROLL_KHUON_MAT=1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_RIAT_ELEARNING_URL=$VITE_RIAT_ELEARNING_URL \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY \
    VITE_ENROLL_KHUON_MAT=$VITE_ENROLL_KHUON_MAT

RUN npm run build

# ---- Phục vụ ----
FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
