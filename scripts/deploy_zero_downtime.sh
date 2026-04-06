#!/usr/bin/env sh
set -eu

DEPLOY_PATH="${DEPLOY_PATH:-$PWD}"
PROJECT_NAME="${PROJECT_NAME:-novax}"
COMPOSE_FILE="${COMPOSE_FILE:-infra/docker/docker-compose.fullstack.yml}"
ENV_FILE="${ENV_FILE:-.env}"
EDGE_PORT="${EDGE_PORT:-3000}"

cd "$DEPLOY_PATH"

COMPOSE_CMD="docker compose -p $PROJECT_NAME -f $COMPOSE_FILE --env-file $ENV_FILE"

# Build all services first so old containers keep serving during build.
$COMPOSE_CMD build auth-service catalog-service cart-service order-service payment-service ai-service api-gateway frontend

# Recreate internal services one-by-one.
for service in auth-service catalog-service cart-service order-service payment-service ai-service api-gateway frontend; do
  $COMPOSE_CMD up -d --no-deps "$service"
done

# Edge proxy is restarted last to minimize external impact.
$COMPOSE_CMD up -d --no-deps edge-proxy

# Health checks
attempt=1
until [ "$attempt" -gt 30 ]; do
  if curl -fsS "http://localhost:${EDGE_PORT}/health" >/dev/null && curl -fsS "http://localhost:${EDGE_PORT}/api/v1/health" >/dev/null; then
    echo "Deployment healthy"
    exit 0
  fi
  attempt=$((attempt + 1))
  sleep 2
done

echo "Deployment health check failed"
exit 1
