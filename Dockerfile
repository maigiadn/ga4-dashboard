# Use Node.js 22-alpine for a small footprint
FROM node:22-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm for flexibility
RUN npm install -g pnpm

# Copy package files (support both npm and pnpm)
COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./

# Install dependencies based on available lockfile
RUN \
  if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  else pnpm install; \
  fi

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# ENV NEXT_TELEMETRY_DISABLED 1

# Performance: Install pnpm if needed for the build step, though npms/scripts often use the package manager in the lockfile
RUN npm install -g pnpm

RUN \
  if [ -f pnpm-lock.yaml ]; then pnpm run build; \
  else npm run build; \
  fi

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
CMD ["node", "server.js"]
