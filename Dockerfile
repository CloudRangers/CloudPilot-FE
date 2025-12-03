# 1) Build Stage
FROM node:20-bullseye AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build  # ← Turbopack 정상 빌드됨

# 2) Run Stage
FROM node:20-bullseye
WORKDIR /app

COPY --from=builder /app .

EXPOSE 3000
CMD ["npm", "start"]
