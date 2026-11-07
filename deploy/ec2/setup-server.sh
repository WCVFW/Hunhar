#!/usr/bin/env bash
# =============================================================================
# One-time setup of a fresh Ubuntu 22.04 / 24.04 EC2 instance for Hunhar:
#   Java 17 + Maven, MySQL 8 (same instance, localhost only), nginx, certbot,
#   AWS CLI, systemd services for the 5 backend services, nightly DB backup to S3.
#
# Usage (from the repo checkout on the server):
#   sudo bash deploy/ec2/setup-server.sh --bucket <s3-backup-bucket> [--uploads-bucket hunhar-uploads] [--region ap-south-1]
#
# Safe to run again: existing passwords and /opt/hunhar/.env are kept.
# =============================================================================
set -euo pipefail

BUCKET=""
REGION="ap-south-1"
UPLOADS_BUCKET="hunhar-uploads"
PREBUILT=0   # --prebuilt: installing a release file, so no Maven/Node build tools on the server
while [ $# -gt 0 ]; do
  case "$1" in
    --bucket) BUCKET="$2"; shift 2 ;;
    --region) REGION="$2"; shift 2 ;;
    --uploads-bucket) UPLOADS_BUCKET="$2"; shift 2 ;;
    --prebuilt) PREBUILT=1; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

[ "$(id -u)" -eq 0 ] || { echo "Run with sudo."; exit 1; }
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
APP=/opt/hunhar
ETC=/etc/hunhar
SERVICES=(identity-service project-service billing-service engagement-service api-gateway)

echo "==> Timezone Asia/Kolkata (backups and logs in IST)"
timedatectl set-timezone Asia/Kolkata

echo "==> 2 GB swap (5 JVMs + MySQL on one instance)"
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Packages"
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  openjdk-17-jdk-headless maven mysql-server nginx certbot python3-certbot-nginx \
  git curl unzip gzip rsync openssl ca-certificates

# Website build needs Node 20.19+ (Vite 8); Ubuntu's own nodejs package is too old
if [ "$PREBUILT" = 0 ] && { ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; }; then
  echo "==> Node.js 22 (NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "==> AWS CLI v2"
  tmp="$(mktemp -d)"
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip" -o "$tmp/awscliv2.zip"
  unzip -q "$tmp/awscliv2.zip" -d "$tmp"
  "$tmp/aws/install"
  rm -rf "$tmp"
fi

echo "==> Service user and folders"
# Services run as hunhar-app: no login, no sudo. (The admin login user "hunhar" is separate.)
id -u hunhar-app >/dev/null 2>&1 || useradd --system --home-dir "$APP" --shell /usr/sbin/nologin hunhar-app
mkdir -p "$APP/app" "$APP/uploads" "$APP/backups" "$ETC" /var/www/hunhar
# The gateway creates its encryption key file (.api-enc-key) in /opt/hunhar, so the service user owns it
chown hunhar-app:hunhar-app "$APP"
chown -R hunhar-app:hunhar-app "$APP/app" "$APP/uploads"
chown root:root "$APP/backups"
chmod 700 "$APP/backups" "$ETC"

echo "==> MySQL (listens on 127.0.0.1 only)"
install -m 644 "$HERE/mysql/zz-hunhar.cnf" /etc/mysql/mysql.conf.d/zz-hunhar.cnf
systemctl enable mysql
systemctl restart mysql

# Passwords are generated once and remembered in root-only files
if [ -f "$ETC/db-app.pass" ]; then DB_PASS="$(cat "$ETC/db-app.pass")"; else DB_PASS="$(openssl rand -hex 24)"; echo -n "$DB_PASS" > "$ETC/db-app.pass"; fi
if [ -f "$ETC/db-backup.pass" ]; then BK_PASS="$(cat "$ETC/db-backup.pass")"; else BK_PASS="$(openssl rand -hex 24)"; echo -n "$BK_PASS" > "$ETC/db-backup.pass"; fi
chmod 600 "$ETC"/*.pass

# Root uses auth_socket on Ubuntu, so plain `mysql` works as root.
# The app user may create/use any theunoia_* database (each service creates its own on first start).
mysql <<SQL
CREATE USER IF NOT EXISTS 'hunhar'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER 'hunhar'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`theunoia\_%\`.* TO 'hunhar'@'localhost';
CREATE USER IF NOT EXISTS 'hunhar_backup'@'localhost' IDENTIFIED BY '${BK_PASS}';
ALTER USER 'hunhar_backup'@'localhost' IDENTIFIED BY '${BK_PASS}';
GRANT SELECT, SHOW VIEW, TRIGGER, LOCK TABLES ON \`theunoia\_%\`.* TO 'hunhar_backup'@'localhost';
FLUSH PRIVILEGES;
SQL

cat > "$ETC/backup.my.cnf" <<EOF
[client]
user=hunhar_backup
password=${BK_PASS}
host=localhost
EOF
chmod 600 "$ETC/backup.my.cnf"

echo "==> Backend settings ($APP/.env)"
if [ ! -f "$APP/.env" ]; then
  cp "$REPO/Hunhar-backend/.env.example" "$APP/.env"
  set_env() { # set_env KEY VALUE  (replaces the line, or appends it)
    if grep -qE "^#? ?$1=" "$APP/.env"; then
      sed -i -E "s|^#? ?$1=.*|$1=$2|" "$APP/.env"
    else
      echo "$1=$2" >> "$APP/.env"
    fi
  }
  set_env DB_HOST 127.0.0.1
  set_env DB_USER hunhar
  set_env DB_PASSWORD "$DB_PASS"
  set_env JWT_SECRET "$(openssl rand -hex 32)"
  set_env INTERNAL_API_KEY "$(openssl rand -hex 24)"
  set_env PAYMENTS_ALLOW_MOCK false
  # Uploaded files and images go to S3 (IAM role, no keys); UPLOADS_DIR is only the local fallback
  set_env STORAGE_TYPE s3
  set_env S3_BUCKET "$UPLOADS_BUCKET"
  set_env AWS_ACCESS_KEY_ID ""
  set_env AWS_SECRET_ACCESS_KEY ""
  set_env UPLOADS_DIR "$APP/uploads"
  set_env S3_REGION "$REGION"
  ADMIN_PASS="$(openssl rand -base64 18 | tr -d '/+=')"
  set_env ADMIN_PASSWORD "$ADMIN_PASS"
  echo -n "$ADMIN_PASS" > "$ETC/admin.pass"
  chmod 600 "$ETC/admin.pass"
  NEW_ENV=1
else
  # Keep everything the admin filled in; only make sure the DB login matches MySQL
  sed -i -E "s|^DB_USER=.*|DB_USER=hunhar|; s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASS}|; s|^DB_HOST=.*|DB_HOST=127.0.0.1|" "$APP/.env"
  NEW_ENV=0
fi
chown hunhar-app:hunhar-app "$APP/.env"
chmod 600 "$APP/.env"

echo "==> systemd services"
install -m 644 "$HERE/systemd/hunhar@.service" /etc/systemd/system/hunhar@.service
install -m 644 "$HERE/systemd/hunhar.target" /etc/systemd/system/hunhar.target
install -m 644 "$HERE/systemd/hunhar-db-backup.service" /etc/systemd/system/hunhar-db-backup.service
install -m 644 "$HERE/systemd/hunhar-db-backup.timer" /etc/systemd/system/hunhar-db-backup.timer
install -m 755 "$HERE/backup/hunhar-db-backup.sh" /usr/local/bin/hunhar-db-backup
install -m 755 "$HERE/backup/hunhar-db-restore.sh" /usr/local/bin/hunhar-db-restore
install -m 755 "$HERE/uploads-to-s3.sh" /usr/local/bin/hunhar-uploads-to-s3
install -m 755 "$HERE/doctor.sh" /usr/local/bin/hunhar-doctor
install -m 755 "$HERE/set-keys.sh" /usr/local/bin/hunhar-set-keys
install -m 755 "$HERE/deploy.sh" /usr/local/bin/hunhar-deploy
systemctl daemon-reload
systemctl enable hunhar.target
for s in "${SERVICES[@]}"; do systemctl enable "hunhar@$s.service" >/dev/null; done

echo "==> Nightly DB backup (02:00 IST) to S3"
if [ ! -f "$ETC/backup.env" ]; then
  cat > "$ETC/backup.env" <<EOF
# Nightly MySQL backup settings (used by /usr/local/bin/hunhar-db-backup)
S3_BUCKET=${BUCKET:-CHANGE-ME-bucket-name}
S3_PREFIX=mysql-backups
AWS_REGION=${REGION}
# Backups older than this many days are deleted from S3
RETENTION_DAYS=7
# Copies kept on this server's disk as well
LOCAL_DIR=${APP}/backups
LOCAL_KEEP_DAYS=2
EOF
elif [ -n "$BUCKET" ]; then
  sed -i -E "s|^S3_BUCKET=.*|S3_BUCKET=${BUCKET}|" "$ETC/backup.env"
fi
chmod 600 "$ETC/backup.env"
systemctl enable --now hunhar-db-backup.timer

echo "==> nginx"
install -m 644 "$HERE/nginx/hunhar-site.conf" /etc/nginx/snippets/hunhar-site.conf
# After certbot has added HTTPS to hunhar.conf, never overwrite it (that would drop the certificates)
if grep -q "managed by Certbot" /etc/nginx/sites-available/hunhar.conf 2>/dev/null; then
  echo "   hunhar.conf has HTTPS from certbot — kept as it is"
else
  install -m 644 "$HERE/nginx/hunhar.conf" /etc/nginx/sites-available/hunhar.conf
fi
ln -sf /etc/nginx/sites-available/hunhar.conf /etc/nginx/sites-enabled/hunhar.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx

echo
echo "============================================================================="
echo " Server ready."
if [ "$NEW_ENV" = 1 ]; then
  echo " 1. Fill in $APP/.env: MAIL_*, GOOGLE_CLIENT_ID, RAZORPAY_*, ADMIN_EMAIL"
  echo "    Admin login password was generated: sudo cat $ETC/admin.pass"
else
  echo " 1. $APP/.env kept as it was (DB login refreshed)."
fi
grep -q 'CHANGE-ME' "$ETC/backup.env" && echo " !  Set S3_BUCKET in $ETC/backup.env (or re-run with --bucket NAME)"
if [ "$PREBUILT" = 1 ]; then
  echo " 2. Start everything:    sudo bash install.sh      (run again from the release folder)"
else
  echo " 2. Build and start:     sudo hunhar-deploy        (backend + website)"
fi
echo " 3. Point DNS (@, www, api) at this server, then HTTPS:"
echo "      sudo certbot --nginx -d hunhar.in -d www.hunhar.in -d api.hunhar.in --redirect"
echo " 4. Test a backup now:   sudo systemctl start hunhar-db-backup && journalctl -u hunhar-db-backup -n 30"
echo "============================================================================="
