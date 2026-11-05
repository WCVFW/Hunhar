#!/usr/bin/env bash
# =============================================================================
# Restore Hunhar databases from a backup made by hunhar-db-backup.
#
#   sudo hunhar-db-restore --list                         # backups in S3
#   sudo hunhar-db-restore hunhar-db-2026-11-04_0200.sql.gz   # from S3 (or a local path)
#
# Stops the backend, replaces every theunoia_* database in the dump, starts the backend again.
# =============================================================================
set -euo pipefail
source /etc/hunhar/backup.env
S3_PREFIX="${S3_PREFIX:-mysql-backups}"
export AWS_DEFAULT_REGION="${AWS_REGION:-ap-south-1}"

[ "$(id -u)" -eq 0 ] || { echo "Run with sudo."; exit 1; }
[ $# -ge 1 ] || { echo "Usage: hunhar-db-restore --list | <backup file name or path>"; exit 1; }

if [ "$1" = "--list" ]; then
  aws s3 ls "s3://$S3_BUCKET/$S3_PREFIX/" | sort
  exit 0
fi

if [ -f "$1" ]; then
  FILE="$1"
else
  FILE="$(mktemp -d)/$(basename "$1")"
  aws s3 cp "s3://$S3_BUCKET/$S3_PREFIX/$(basename "$1")" "$FILE" --only-show-errors
fi
gzip -t "$FILE"

echo "This REPLACES the live databases with $(basename "$FILE")."
read -r -p "Type RESTORE to continue: " answer
[ "$answer" = "RESTORE" ] || { echo "Cancelled."; exit 1; }

systemctl stop hunhar.target
# The dump contains CREATE DATABASE / USE statements for each theunoia_* database
gunzip -c "$FILE" | mysql
systemctl start hunhar.target
echo "Restored. Services are starting: systemctl status 'hunhar@*'"
