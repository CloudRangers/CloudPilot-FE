# 1) Build Stage
FROM node:20-bullseye AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build  

# 2) Run Stage
FROM node:20-bullseye
WORKDIR /app

COPY --from=builder /app .

EXPOSE 3000
CMD ["npm", "start"]
