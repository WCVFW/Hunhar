#!/usr/bin/env bash
# =============================================================================
# Hunhar MySQL backup -> Amazon S3. Run nightly at 02:00 IST by hunhar-db-backup.timer.
#
#   1. mysqldump of every theunoia_* database into one gzip'd .sql file
#   2. upload to s3://$S3_BUCKET/$S3_PREFIX/hunhar-db-YYYY-MM-DD_HHMM.sql.gz (server-side encrypted)
#   3. delete backups in S3 older than RETENTION_DAYS (7) and local copies older than LOCAL_KEEP_DAYS (2)
#
# Settings: /etc/hunhar/backup.env    MySQL login: /etc/hunhar/backup.my.cnf (read-only backup user)
# S3 access: the EC2 instance's IAM role (see deploy/ec2/aws/backup-iam-policy.json)
# Run by hand:  sudo systemctl start hunhar-db-backup   then   journalctl -u hunhar-db-backup -n 50
# =============================================================================
set -euo pipefail

CONF=/etc/hunhar/backup.env
MYCNF=/etc/hunhar/backup.my.cnf
# shellcheck source=/dev/null
source "$CONF"

: "${S3_BUCKET:?Set S3_BUCKET in $CONF}"
[[ "$S3_BUCKET" == CHANGE-ME* ]] && { echo "Set S3_BUCKET in $CONF"; exit 1; }
S3_PREFIX="${S3_PREFIX:-mysql-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
LOCAL_DIR="${LOCAL_DIR:-/opt/hunhar/backups}"
LOCAL_KEEP_DAYS="${LOCAL_KEEP_DAYS:-2}"
export AWS_DEFAULT_REGION="${AWS_REGION:-ap-south-1}"

STAMP="$(date +%Y-%m-%d_%H%M)"
NAME="hunhar-db-$STAMP.sql.gz"
FILE="$LOCAL_DIR/$NAME"
mkdir -p "$LOCAL_DIR"
chmod 700 "$LOCAL_DIR"

DBS="$(mysql --defaults-extra-file="$MYCNF" -N -B -e "SHOW DATABASES LIKE 'theunoia\_%'" | tr -d '\r')"
[ -n "$DBS" ] || { echo "No theunoia_* databases found — nothing to back up"; exit 1; }
echo "Backing up: $(echo "$DBS" | tr '\n' ' ')"

# --single-transaction: consistent snapshot without locking the live site
# shellcheck disable=SC2086
mysqldump --defaults-extra-file="$MYCNF" \
  --single-transaction --quick --triggers --no-tablespaces --set-gtid-purged=OFF --add-drop-database \
  --default-character-set=utf8mb4 \
  --databases $DBS | gzip -9 > "$FILE.part"
gzip -t "$FILE.part"
mv "$FILE.part" "$FILE"
echo "Dump OK: $FILE ($(du -h "$FILE" | cut -f1))"

aws s3 cp "$FILE" "s3://$S3_BUCKET/$S3_PREFIX/$NAME" --sse AES256 --only-show-errors
echo "Uploaded: s3://$S3_BUCKET/$S3_PREFIX/$NAME"

# Keep the last RETENTION_DAYS days in S3. File names carry the date, so compare those.
CUTOFF="$(date -d "-$RETENTION_DAYS days" +%Y-%m-%d_%H%M)"
aws s3api list-objects-v2 --bucket "$S3_BUCKET" --prefix "$S3_PREFIX/hunhar-db-" \
    --query 'Contents[].Key' --output text \
  | tr '\t' '\n' \
  | while read -r key; do
      [ -z "$key" ] || [ "$key" = "None" ] && continue
      stamp="${key##*/hunhar-db-}"
      stamp="${stamp%.sql.gz}"
      if [[ ! "$stamp" > "$CUTOFF" ]]; then # 7-day-old and older (today + previous 6 nights remain)
        aws s3 rm "s3://$S3_BUCKET/$key" --only-show-errors
        echo "Deleted old backup: $key"
      fi
    done

find "$LOCAL_DIR" -maxdepth 1 -name 'hunhar-db-*.sql.gz' -mtime +"$LOCAL_KEEP_DAYS" -delete
find "$LOCAL_DIR" -maxdepth 1 -name 'hunhar-db-*.part' -mmin +120 -delete

date -Iseconds > "$LOCAL_DIR/last-success"
echo "Backup finished"
