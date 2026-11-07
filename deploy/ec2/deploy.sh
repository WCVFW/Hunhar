#!/usr/bin/env bash
# =============================================================================
# Build and (re)start Hunhar on the EC2 server. Installed as /usr/local/bin/hunhar-deploy.
#
#   sudo hunhar-deploy                  # git pull, build backend + website, restart, health check
#   sudo hunhar-deploy --no-pull        # build what is checked out now
#   sudo hunhar-deploy --backend-only   # skip the website
#   sudo hunhar-deploy --frontend-only  # only rebuild and publish the website
#   sudo hunhar-deploy --release DIR    # install a pre-built release: whatever it contains
#                                       #   (app/<service>.jar for changed services, web/ if the site changed)
#   sudo hunhar-deploy --rollback       # put back what the last deploy replaced (services + website)
#
# Safety:
#   - MySQL is never stopped. Before any backend change it is dumped to /opt/hunhar/backups/pre-deploy-*.sql.gz
#     (last 5 kept), because services update the schema when they start.
#   - Services are replaced ONE AT A TIME (backends first, gateway last) and each must report UP before the
#     next one; the rest of the site keeps working. A service that does not come up is put back at once.
#   - The website is swapped in one step (no downtime); the previous one is kept for --rollback.
#
# The repo checkout defaults to /opt/hunhar/src (override with HUNHAR_SRC=/path).
# =============================================================================
set -euo pipefail

SRC="${HUNHAR_SRC:-/opt/hunhar/src}"
APP=/opt/hunhar
WEB=/var/www/hunhar
ROLLBACK="$APP/rollback"
BACKUPS="$APP/backups"
PULL=1
BACKEND=1
FRONTEND=1
RELEASE=""
DO_ROLLBACK=0
while [ $# -gt 0 ]; do
  case "$1" in
    --no-pull) PULL=0 ;;
    --backend-only) FRONTEND=0 ;;
    --frontend-only) BACKEND=0 ;;
    --release) RELEASE="$(cd "$2" && pwd)"; PULL=0; shift ;;
    --rollback) DO_ROLLBACK=1 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
  shift
done

[ "$(id -u)" -eq 0 ] || { echo "Run with sudo."; exit 1; }

# Order matters: backends first, gateway last. name:port (port = health check)
ALL_SERVICES=(identity-service:8081 project-service:8082 billing-service:8083 engagement-service:8084 api-gateway:8080)

healthy() { # healthy NAME PORT -> 0 when /actuator/health says UP within 3 minutes
  local name="$1" port="$2"
  for _ in $(seq 1 90); do
    # identity-service may check the SMTP server inside /health, which can take a few seconds
    if curl -fs -m 10 "http://127.0.0.1:$port/actuator/health" | grep -q '"UP"'; then return 0; fi
    if ! systemctl is-active --quiet "hunhar@$name" && [ "$(systemctl show -p NRestarts --value "hunhar@$name")" -gt 3 ]; then return 1; fi
    sleep 2
  done
  return 1
}

port_of() { local n; for n in "${ALL_SERVICES[@]}"; do [ "${n%%:*}" = "$1" ] && { echo "${n#*:}"; return; }; done; }

website_ok() {
  curl -fsk -m 5 --resolve www.hunhar.in:443:127.0.0.1 https://www.hunhar.in/ 2>/dev/null | grep -q '<div id="root">' \
    || curl -fs -m 5 http://127.0.0.1/ | grep -q '<div id="root">'
}

publish_web() { # publish_web DIR — one-step swap; the site that was live is kept as $WEB.prev
  local dist="$1"
  [ -f "$dist/index.html" ] || { echo "Website build has no index.html"; return 1; }
  rm -rf "$WEB.new"
  cp -a "$dist" "$WEB.new"
  chown -R root:root "$WEB.new"
  chmod -R a+rX "$WEB.new"
  rm -rf "$WEB.prev"
  [ -d "$WEB" ] && mv "$WEB" "$WEB.prev"
  mv "$WEB.new" "$WEB"
}

# ----------------------------------------------------------------------------- rollback
if [ "$DO_ROLLBACK" = 1 ]; then
  [ -d "$ROLLBACK" ] || { echo "Nothing to roll back."; exit 1; }
  echo "==> Rolling back the last deploy"
  rc=0
  for item in "${ALL_SERVICES[@]}"; do
    name="${item%%:*}"; port="${item#*:}"
    [ -f "$ROLLBACK/app/$name.jar" ] || continue
    install -o hunhar-app -g hunhar-app -m 644 "$ROLLBACK/app/$name.jar" "$APP/app/$name.jar"
    systemctl restart "hunhar@$name"
    if healthy "$name" "$port"; then echo "   $name  restored, UP"; else echo "   $name  restored but NOT UP"; rc=1; fi
  done
  if [ -f "$ROLLBACK/web" ] && [ -d "$WEB.prev" ]; then
    rm -rf "$WEB.bad"; mv "$WEB" "$WEB.bad"; mv "$WEB.prev" "$WEB"; rm -rf "$WEB.bad"
    website_ok && echo "   website  restored" || { echo "   website NOT served"; rc=1; }
  fi
  rm -rf "$ROLLBACK"
  [ "$rc" = 0 ] && echo "==> Rollback finished: previous version is live" || echo "==> Rollback finished with errors"
  exit "$rc"
fi

# ----------------------------------------------------------------------------- what to deploy
if [ -n "$RELEASE" ]; then
  # A release may hold only changed services, only the website, or only server scripts (install.sh installs those)
  [ -f "$RELEASE/install.sh" ] || [ -d "$RELEASE/app" ] || [ -d "$RELEASE/web" ] || { echo "$RELEASE is not a Hunhar release."; exit 1; }
else
  [ -d "$SRC/Hunhar-backend" ] || { echo "Repo not found at $SRC (set HUNHAR_SRC)."; exit 1; }
  if [ "$PULL" = 1 ] && [ -d "$SRC/.git" ]; then
    echo "==> git pull"
    git -C "$SRC" pull --ff-only
  fi
fi

DEPLOY_SERVICES=()
if [ "$BACKEND" = 1 ]; then
  if [ -n "$RELEASE" ]; then
    for item in "${ALL_SERVICES[@]}"; do [ -f "$RELEASE/app/${item%%:*}.jar" ] && DEPLOY_SERVICES+=("${item%%:*}"); done
  else
    echo "==> Building backend"
    ( cd "$SRC/Hunhar-backend" && mvn -B -q clean package -DskipTests )
    for item in "${ALL_SERVICES[@]}"; do DEPLOY_SERVICES+=("${item%%:*}"); done
  fi
fi

WEB_DIST=""
if [ "$FRONTEND" = 1 ]; then
  if [ -n "$RELEASE" ]; then
    [ -f "$RELEASE/web/index.html" ] && WEB_DIST="$RELEASE/web"
  else
    echo "==> Building website"
    command -v node >/dev/null || { echo "Node.js is missing — re-run setup-server.sh"; exit 1; }
    ( cd "$SRC/Hunhar-frontend" && npm ci --no-audit --no-fund --loglevel=error && npm run build )
    WEB_DIST="$SRC/Hunhar-frontend/dist"
  fi
fi

echo "==> This deploy: services [${DEPLOY_SERVICES[*]:-none}], website [$([ -n "$WEB_DIST" ] && echo yes || echo no)]"
[ "${#DEPLOY_SERVICES[@]}" -gt 0 ] || [ -n "$WEB_DIST" ] || { echo "==> Nothing to deploy"; exit 0; }

# Fresh rollback point for THIS deploy
rm -rf "$ROLLBACK"
mkdir -p "$ROLLBACK/app"

# ----------------------------------------------------------------------------- backend (rolling)
if [ "${#DEPLOY_SERVICES[@]}" -gt 0 ]; then
  echo "==> Database backup before the backend changes (MySQL keeps running)"
  mkdir -p "$BACKUPS"; chmod 700 "$BACKUPS"
  DBS="$(mysql -N -B -e "SHOW DATABASES LIKE 'theunoia\_%'" | tr '\n' ' ')"
  if [ -n "${DBS// /}" ]; then
    dump="$BACKUPS/pre-deploy-$(date +%Y-%m-%d_%H%M%S).sql.gz"
    # shellcheck disable=SC2086
    mysqldump --single-transaction --quick --triggers --no-tablespaces --set-gtid-purged=OFF --add-drop-database \
      --default-character-set=utf8mb4 --databases $DBS | gzip -6 > "$dump.part"
    gzip -t "$dump.part" && mv "$dump.part" "$dump"
    echo "   saved $(basename "$dump") ($(du -h "$dump" | cut -f1)) — restore: gunzip -c $dump | sudo mysql"
    ls -1t "$BACKUPS"/pre-deploy-*.sql.gz 2>/dev/null | tail -n +6 | xargs -r rm -f
  fi

  echo "==> Replacing services one at a time"
  for name in "${DEPLOY_SERVICES[@]}"; do
    port="$(port_of "$name")"
    if [ -n "$RELEASE" ]; then jar="$RELEASE/app/$name.jar"; else jar="$SRC/Hunhar-backend/$name/target/$name-1.0.0.jar"; fi
    [ -f "$APP/app/$name.jar" ] && cp -p "$APP/app/$name.jar" "$ROLLBACK/app/$name.jar"
    install -o hunhar-app -g hunhar-app -m 644 "$jar" "$APP/app/$name.jar"
    systemctl restart "hunhar@$name"
    if healthy "$name" "$port"; then
      echo "   $name  UP"
    else
      echo "   $name  NOT UP — putting the previous version back"
      journalctl -u "hunhar@$name" -n 40 --no-pager -o cat | grep -E "ERROR|Exception|Caused by" | tail -5 | cut -c1-220 | sed 's/^/      /' || true
      if [ -f "$ROLLBACK/app/$name.jar" ]; then
        install -o hunhar-app -g hunhar-app -m 644 "$ROLLBACK/app/$name.jar" "$APP/app/$name.jar"
        systemctl restart "hunhar@$name"
        healthy "$name" "$port" && echo "   $name  previous version is back UP" || echo "   $name  previous version also NOT UP — check: journalctl -u hunhar@$name -n 100"
      fi
      echo "==> Deploy STOPPED. Services already replaced in this deploy stay on the new version;"
      echo "    run 'sudo hunhar-deploy --rollback' to put all of them back."
      exit 1
    fi
  done
fi

# ----------------------------------------------------------------------------- website (one-step swap)
if [ -n "$WEB_DIST" ]; then
  echo "==> Publishing website (no downtime)"
  publish_web "$WEB_DIST"
  touch "$ROLLBACK/web"
  if website_ok; then echo "   website OK"; else echo "   website NOT served — check: sudo nginx -t"; exit 1; fi
fi

echo "==> Deploy finished: everything that changed is UP (undo: sudo hunhar-deploy --rollback)"
