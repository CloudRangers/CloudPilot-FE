# ----------------------------
# 1) Build Stage
# ----------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build Next.js
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN npm run build


# ----------------------------
# 2) Production Runtime Stage
# ----------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Copy package.json to runtime
COPY package*.json ./

# Copy node_modules from build stage (필수!)
COPY --from=builder /app/node_modules ./node_modules

# Copy build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# EXPOSE
EXPOSE 3000

# Start
CMD ["npm", "start"]
