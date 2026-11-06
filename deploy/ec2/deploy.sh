#!/usr/bin/env bash
# =============================================================================
# Build and (re)start Hunhar on the EC2 server. Installed as /usr/local/bin/hunhar-deploy.
#
#   sudo hunhar-deploy                  # git pull, build backend + website, restart, health check
#   sudo hunhar-deploy --no-pull        # build what is checked out now
#   sudo hunhar-deploy --backend-only   # skip the website
#   sudo hunhar-deploy --frontend-only  # only rebuild and publish the website
#   sudo hunhar-deploy --release DIR    # install a pre-built release (app/*.jar + web/), no build on the server
#
# The repo checkout defaults to /opt/hunhar/src (override with HUNHAR_SRC=/path).
# The website is served by nginx from /var/www/hunhar (https://www.hunhar.in).
# =============================================================================
set -euo pipefail

SRC="${HUNHAR_SRC:-/opt/hunhar/src}"
APP=/opt/hunhar
WEB=/var/www/hunhar
PULL=1
BACKEND=1
FRONTEND=1
RELEASE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --no-pull) PULL=0 ;;
    --backend-only) FRONTEND=0 ;;
    --frontend-only) BACKEND=0 ;;
    --release) RELEASE="$(cd "$2" && pwd)"; PULL=0; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
  shift
done

[ "$(id -u)" -eq 0 ] || { echo "Run with sudo."; exit 1; }
if [ -n "$RELEASE" ]; then
  [ -d "$RELEASE/app" ] && [ -f "$RELEASE/web/index.html" ] || { echo "$RELEASE is not a Hunhar release (needs app/ and web/)."; exit 1; }
else
  [ -d "$SRC/Hunhar-backend" ] || { echo "Repo not found at $SRC (set HUNHAR_SRC)."; exit 1; }
fi

# Backends first, gateway last; port = health check target
SERVICES=(identity-service:8081 project-service:8082 billing-service:8083 engagement-service:8084 api-gateway:8080)

if [ "$PULL" = 1 ] && [ -d "$SRC/.git" ]; then
  echo "==> git pull"
  git -C "$SRC" pull --ff-only
fi

failed=0

if [ "$BACKEND" = 1 ]; then
  if [ -z "$RELEASE" ]; then
    echo "==> Building backend"
    ( cd "$SRC/Hunhar-backend" && mvn -B -q clean package -DskipTests )
  fi

  echo "==> Installing jars"
  for item in "${SERVICES[@]}"; do
    name="${item%%:*}"
    if [ -n "$RELEASE" ]; then jar="$RELEASE/app/$name.jar"; else jar="$SRC/Hunhar-backend/$name/target/$name-1.0.0.jar"; fi
    install -o hunhar-app -g hunhar-app -m 644 "$jar" "$APP/app/$name.jar"
  done

  echo "==> Restarting services"
  for item in "${SERVICES[@]}"; do
    systemctl restart "hunhar@${item%%:*}"
  done

  echo "==> Waiting for health checks (up to 3 minutes each)"
  for item in "${SERVICES[@]}"; do
    name="${item%%:*}"; port="${item#*:}"
    ok=0
    for _ in $(seq 1 90); do
      # identity-service checks the SMTP server inside /health, which can take a few seconds
      if curl -fs -m 10 "http://127.0.0.1:$port/actuator/health" | grep -q '"UP"'; then ok=1; break; fi
      sleep 2
    done
    if [ "$ok" = 1 ]; then
      echo "   $name  UP"
    else
      echo "   $name  NOT UP — see: journalctl -u hunhar@$name -n 100 --no-pager"
      failed=1
    fi
  done
fi

if [ "$FRONTEND" = 1 ]; then
  if [ -n "$RELEASE" ]; then
    DIST="$RELEASE/web"
  else
    echo "==> Building website"
    command -v node >/dev/null || { echo "Node.js is missing — re-run setup-server.sh"; exit 1; }
    # .env.production (in git) sets VITE_API_BASE_URL=https://api.hunhar.in
    ( cd "$SRC/Hunhar-frontend" && npm ci --no-audit --no-fund --loglevel=error && npm run build )
    DIST="$SRC/Hunhar-frontend/dist"
  fi
  [ -f "$DIST/index.html" ] || { echo "Website build has no index.html"; exit 1; }

  echo "==> Publishing website to $WEB"
  # Copy next to the live folder, then swap, so visitors never see a half-copied site
  rm -rf "$WEB.new"
  cp -a "$DIST" "$WEB.new"
  chown -R root:root "$WEB.new"
  chmod -R a+rX "$WEB.new"
  rm -rf "$WEB.old"
  [ -d "$WEB" ] && mv "$WEB" "$WEB.old"
  mv "$WEB.new" "$WEB"
  rm -rf "$WEB.old"
  # HTTPS once certbot has run (http then only redirects), plain HTTP before that
  if curl -fsk -m 5 --resolve www.hunhar.in:443:127.0.0.1 https://www.hunhar.in/ 2>/dev/null | grep -q '<div id="root">' \
     || curl -fs -m 5 -H "Host: www.hunhar.in" http://127.0.0.1/ | grep -q '<div id="root">'; then
    echo "   website OK"
  else
    echo "   website NOT served — check: sudo nginx -t && journalctl -u nginx -n 50"
    failed=1
  fi
fi

[ "$failed" = 0 ] && echo "==> Deploy finished: everything is UP" || { echo "==> Deploy finished with errors"; exit 1; }
