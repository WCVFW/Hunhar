#!/usr/bin/env bash
# =============================================================================
# Hunhar release installer — copied to the top of every hunhar-release-*.tar.gz.
#
#   First time on a new server:  sudo bash install.sh --bucket <s3-backup-bucket>
#     -> installs MySQL/nginx/Java, creates /opt/hunhar/.env, then stops so you can fill in your keys
#   After filling /opt/hunhar/.env, and for every new release:  sudo bash install.sh
#     -> installs the backend jars + website, restarts, checks everything is UP
#   Re-apply server config (nginx/systemd/backup) from this release:  sudo bash install.sh --setup
# =============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
[ "$(id -u)" -eq 0 ] || { echo "Run with sudo:  sudo bash install.sh"; exit 1; }
[ -f "$HERE/VERSION" ] && echo "Hunhar release: $(head -1 "$HERE/VERSION")"

SETUP=0
SETUP_ARGS=(--prebuilt)
while [ $# -gt 0 ]; do
  case "$1" in
    --setup) SETUP=1 ;;
    --bucket|--region) SETUP=1; SETUP_ARGS+=("$1" "$2"); shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
  shift
done

FIRST_TIME=0
[ -f /opt/hunhar/.env ] || FIRST_TIME=1

if [ "$FIRST_TIME" = 1 ] || [ "$SETUP" = 1 ] || [ ! -f /etc/systemd/system/hunhar@.service ]; then
  bash "$HERE/deploy/ec2/setup-server.sh" "${SETUP_ARGS[@]}"
fi

if [ "$FIRST_TIME" = 1 ]; then
  echo
  echo "First-time setup done. Next:"
  echo "  1. sudo nano /opt/hunhar/.env     (MAIL_*, GOOGLE_CLIENT_ID, RAZORPAY_*, ADMIN_EMAIL, FAST2SMS_API_KEY)"
  echo "  2. sudo bash install.sh           (starts the backend and publishes the website)"
  exit 0
fi

# Newest scripts from this release, then install it
install -m 755 "$HERE/deploy/ec2/deploy.sh" /usr/local/bin/hunhar-deploy
install -m 755 "$HERE/deploy/ec2/backup/hunhar-db-backup.sh" /usr/local/bin/hunhar-db-backup
install -m 755 "$HERE/deploy/ec2/backup/hunhar-db-restore.sh" /usr/local/bin/hunhar-db-restore
bash "$HERE/deploy/ec2/deploy.sh" --release "$HERE"
