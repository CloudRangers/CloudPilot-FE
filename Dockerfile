# 1) Build Stage
FROM node:20-bullseye AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
RUN echo "Using API URL: $NEXT_PUBLIC_API_BASE_URL"
RUN npm run build

# 2) Run Stage
FROM node:20-bullseye AS runner

WORKDIR /app

# package.json 복사
COPY package*.json ./

# 런타임용 node_modules 복사
COPY --from=builder /app/node_modules ./node_modules

# 빌드 결과물 복사
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

RUN npm install -g pm2
CMD ["npm", "start"]

