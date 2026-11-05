#!/usr/bin/env bash
# =============================================================================
# Builds ONE file to deploy:  release/hunhar-release-<date>-<time>.tar.gz
#   app/<service>.jar   5 backend services (built with Maven)
#   web/                the website (Vite production build -> calls https://api.hunhar.in)
#   deploy/ec2/         server scripts and configs
#   install.sh          run this on the server
#
# Run from the repo (Git Bash on Windows, or Linux/macOS):   bash deploy/ec2/build-release.sh
# Needs: Java 17+, Maven, Node 20.19+. No secrets go into the file (.env is never included).
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/release"
STAMP="$(date +%Y%m%d-%H%M)"
NAME="hunhar-release-$STAMP"
STAGE="$OUT/$NAME"
SERVICES=(identity-service project-service billing-service engagement-service api-gateway)

rm -rf "$STAGE"
mkdir -p "$STAGE/app" "$STAGE/deploy" "$STAGE/Hunhar-backend"

echo "==> Building backend (Maven)"
( cd "$ROOT/Hunhar-backend" && mvn -B -q clean package -DskipTests )
for s in "${SERVICES[@]}"; do
  cp "$ROOT/Hunhar-backend/$s/target/$s-1.0.0.jar" "$STAGE/app/$s.jar"
done

echo "==> Building website (Vite, production)"
( cd "$ROOT/Hunhar-frontend" && { [ -d node_modules ] || npm ci --no-audit --no-fund; } && npm run build )
cp -r "$ROOT/Hunhar-frontend/dist" "$STAGE/web"
grep -q 'api.hunhar.in' "$STAGE"/web/assets/*.js || { echo "Website build does not point at https://api.hunhar.in"; exit 1; }

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
} > "$STAGE/VERSION"

echo "==> Packing"
tar -czf "$OUT/$NAME.tar.gz" -C "$OUT" "$NAME"
rm -rf "$STAGE"
( cd "$OUT" && sha256sum "$NAME.tar.gz" > "$NAME.tar.gz.sha256" )

echo
echo "Release file: $OUT/$NAME.tar.gz ($(du -h "$OUT/$NAME.tar.gz" | cut -f1))"
echo "Copy it to the server and run:  tar -xzf $NAME.tar.gz && cd $NAME && sudo bash install.sh"
