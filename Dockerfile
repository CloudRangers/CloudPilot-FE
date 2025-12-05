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


COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

RUN npm install -g pm2

EXPOSE 3000

CMD ["pm2-runtime", "npm", "--", "start"]

