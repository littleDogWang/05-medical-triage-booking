FROM node:22-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm@9.15.9
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@9.15.9
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Next.js embeds this public identifier in the browser bundle at build time.
# The App Certificate is runtime-only and is never a build argument.
ARG NEXT_PUBLIC_AGORA_APP_ID
ENV NEXT_PUBLIC_AGORA_APP_ID=$NEXT_PUBLIC_AGORA_APP_ID
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
RUN mkdir -p /app/.scenario-data && chown nextjs:nodejs /app/.scenario-data
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
