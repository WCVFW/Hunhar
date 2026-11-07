#!/usr/bin/env bash
# =============================================================================
# Builds ONE file to deploy:  release/hunhar-release-<date>-<time>.tar.gz
#   app/<service>.jar   backend services (built with Maven) — all 5, or only those in SERVICES
#   web/                the website (Vite production build -> calls /api/ on its own address), unless WEBSITE=0
#   deploy/ec2/         server scripts and configs
#   install.sh          run this on the server
#
# Run from the repo (Git Bash on Windows, or Linux/macOS):   bash deploy/ec2/build-release.sh
# Partial release (Jenkins does this from the changed files):
#   SERVICES="project-service api-gateway" WEBSITE=0 bash deploy/ec2/build-release.sh   # 2 services only
#   SERVICES="" WEBSITE=1 bash deploy/ec2/build-release.sh                               # website only
# Needs: Java 17+, Maven, Node 20.19+. No secrets go into the file (.env is never included).
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/release"
STAMP="$(date +%Y%m%d-%H%M)"
NAME="${RELEASE_NAME:-hunhar-release-$STAMP}"   # Jenkins passes its own name (build number + commit)
STAGE="$OUT/$NAME"
# SERVICES unset = all 5; "none" (or empty) = no services; otherwise only those. WEBSITE=0 leaves the website out.
# (Jenkins drops an empty environment variable, so it passes "none".)
if [ -z "${SERVICES+x}" ]; then SERVICES="identity-service project-service billing-service engagement-service api-gateway"; fi
[ "$SERVICES" = "none" ] && SERVICES=""
read -r -a SERVICE_LIST <<< "$SERVICES"
WEBSITE="${WEBSITE:-1}"

rm -rf "$STAGE"
mkdir -p "$STAGE/deploy" "$STAGE/Hunhar-backend"

if [ "${#SERVICE_LIST[@]}" -gt 0 ]; then
  mkdir -p "$STAGE/app"
  echo "==> Building backend (Maven): ${SERVICE_LIST[*]}"
  modules="$(IFS=,; echo "${SERVICE_LIST[*]}")"
  ( cd "$ROOT/Hunhar-backend" && mvn -B -q clean package -DskipTests -pl "$modules" -am )
  for s in "${SERVICE_LIST[@]}"; do
    cp "$ROOT/Hunhar-backend/$s/target/$s-1.0.0.jar" "$STAGE/app/$s.jar"
  done
fi

if [ "$WEBSITE" = 1 ]; then
  echo "==> Building website (Vite, production)"
  ( cd "$ROOT/Hunhar-frontend" && { [ -d node_modules ] || npm ci --no-audit --no-fund; } && npm run build )
  cp -r "$ROOT/Hunhar-frontend/dist" "$STAGE/web"
  # Production calls the API on its own address (/api/...); a dev URL must never ship
  ! grep -q 'localhost:8080' "$STAGE"/web/assets/*.js || { echo "Website build still calls http://localhost:8080"; exit 1; }
fi

echo "==> Adding server scripts"
cp -r "$ROOT/deploy/ec2" "$STAGE/deploy/ec2"
cp "$ROOT/Hunhar-backend/.env.example" "$STAGE/Hunhar-backend/.env.example"
cp "$ROOT/deploy/ec2/install.sh" "$STAGE/install.sh"
# Windows checkouts may have CRLF; the server needs LF
find "$STAGE/deploy" "$STAGE/install.sh" -type f \( -name '*.sh' -o -name '*.conf' -o -name '*.cnf' -o -name '*.service' -o -name '*.timer' -o -name '*.target' -o -name '*.json' \) \
  -exec sed -i 's/\r$//' {} +

{
  echo "$STAMP  commit $(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)$( [ -n "$(git -C "$ROOT" status --porcelain 2>/dev/null)" ] && echo ' + uncommitted changes')"
  echo "built on $(hostname) by $(git -C "$ROOT" config user.name 2>/dev/null || whoami)"
  echo "services: ${SERVICE_LIST[*]:-none}; website: $([ "$WEBSITE" = 1 ] && echo yes || echo no)"
} > "$STAGE/VERSION"

echo "==> Packing"
tar -czf "$OUT/$NAME.tar.gz" -C "$OUT" "$NAME"
rm -rf "$STAGE"
( cd "$OUT" && sha256sum "$NAME.tar.gz" > "$NAME.tar.gz.sha256" )

echo
echo "Release file: $OUT/$NAME.tar.gz ($(du -h "$OUT/$NAME.tar.gz" | cut -f1))"
echo "Copy it to the server and run:  tar -xzf $NAME.tar.gz && cd $NAME && sudo bash install.sh"
