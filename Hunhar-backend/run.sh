#!/usr/bin/env bash
# THEUNOiA backend - one command to build, start, check and stop the whole platform (Linux / macOS / Git Bash).
#   ./run.sh start | stop | restart | status | logs [service] | demo | clean | test | infra
set -euo pipefail
cd "$(dirname "$0")"

GATEWAY=http://localhost:8080
SERVICES="api-gateway auth-service user-service project-service credit-service payment-service messaging-service \
notification-service community-service content-service analytics-service file-service"

step() { printf '\n\033[36m==> %s\033[0m\n' "$1"; }
ok()   { printf '    \033[32m[OK]\033[0m %s\n' "$1"; }

need_docker() {
  command -v docker >/dev/null || { echo "Docker is not installed (give it >= 8 GB RAM)"; exit 1; }
  docker info >/dev/null 2>&1 || { echo "Docker daemon is not running"; exit 1; }
}
ensure_env() { [ -f .env ] || { cp .env.example .env; ok "created .env from .env.example"; }; }

wait_healthy() {
  step "Waiting for all services to become healthy..."
  for _ in $(seq 1 90); do
    pending=""
    for s in $SERVICES; do
      docker compose ps --format '{{.Service}}|{{.Health}}' | grep -q "^$s|healthy$" || pending="$pending $s"
    done
    [ -z "$pending" ] && { ok "All 12 microservices are healthy"; return 0; }
    echo "    waiting for:$pending"; sleep 10
  done
  echo "Timed out - check ./run.sh status and ./run.sh logs <service>"; exit 1
}

urls() {
  cat <<EOF

  THEUNOiA is running
  ---------------------------------------------------------------
  API Gateway (all APIs)   $GATEWAY
  MailHog (emails)         http://localhost:8025
  RabbitMQ console         http://localhost:15672   (theunoia / theunoia)
  MinIO console            http://localhost:9001    (minioadmin / minioadmin)
  Admin login              admin@theunoia.com / Admin@12345
  Full demo flow (Windows) .\\run.ps1 demo   (needs PowerShell; on Linux: pwsh ./scripts/demo-flow.ps1)

EOF
}

case "${1:-start}" in
  test)    step "Running all tests"; mvn -B clean verify ;;
  infra)   need_docker; ensure_env; docker compose up -d postgres redis rabbitmq minio mailhog; ok "infra up" ;;
  start)   need_docker; ensure_env; step "Building and starting everything"; docker compose up -d --build; wait_healthy; urls ;;
  restart) need_docker; docker compose restart ${2:-}; wait_healthy ;;
  stop)    need_docker; docker compose down; ok "stopped (data kept)" ;;
  clean)   need_docker; docker compose down -v --remove-orphans; ok "stopped and data deleted" ;;
  status)  need_docker; docker compose ps; curl -fsS "$GATEWAY/actuator/health" && echo ;;
  logs)    need_docker; docker compose logs -f --tail 200 ${2:-} ;;
  demo)    pwsh ./scripts/demo-flow.ps1 -Gateway "$GATEWAY" ;;
  *)       echo "usage: $0 start|stop|restart|status|logs [svc]|demo|clean|test|infra"; exit 1 ;;
esac
