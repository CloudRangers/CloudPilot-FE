# 1) 빌드 단계
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 2) 실행 단계
FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app ./

EXPOSE 3000
CMD ["npm", "start"]
