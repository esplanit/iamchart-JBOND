# James Bond API (Fastify + tsx). 모노레포 루트 컨텍스트에서 빌드한다.
#   docker build -f apps/api/Dockerfile -t jbond-api .
FROM node:22.23.4-alpine

WORKDIR /app

# 워크스페이스 매니페스트 (API 는 shared-types / bond-engine 에 의존)
COPY package.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/bond-engine/package.json packages/bond-engine/
COPY packages/ui/package.json packages/ui/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

# API 실행에 필요한 워크스페이스만 설치
RUN npm install --omit=dev --workspace apps/api --include-workspace-root --no-audit --no-fund \
    || npm install --no-audit --no-fund

# 소스 복사
COPY packages/shared-types packages/shared-types
COPY packages/bond-engine packages/bond-engine
COPY apps/api apps/api

ENV NODE_ENV=production
ENV API_PORT=4000
ENV API_HOST=0.0.0.0
ENV DATA_SOURCE_MODE=mock
EXPOSE 4000

CMD ["npm", "run", "start", "--workspace", "apps/api"]
