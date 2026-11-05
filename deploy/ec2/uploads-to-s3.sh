#!/usr/bin/env bash
# =============================================================================
# Store all uploaded files and images (avatars, logos, portfolio, project files, proposals, chat
# attachments) in Amazon S3, and move files already saved on this server's disk into the bucket.
# Installed as /usr/local/bin/hunhar-uploads-to-s3.
#
#   sudo hunhar-uploads-to-s3                  # bucket hunhar-uploads, region from .env (ap-south-1)
#   sudo hunhar-uploads-to-s3 my-other-bucket
#
# Safe to run again. Local copies are kept until you delete them yourself.
# S3 access comes from the instance's IAM role (deploy/ec2/aws/uploads-iam-policy.json).
# =============================================================================
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "Run with sudo."; exit 1; }

BUCKET="${1:-hunhar-uploads}"
ENV_FILE=/opt/hunhar/.env
[ -f "$ENV_FILE" ] || { echo "$ENV_FILE not found — set the server up first."; exit 1; }

env_get() { grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2- || true; }
env_set() {
  if grep -qE "^#? ?$1=" "$ENV_FILE"; then sed -i -E "s|^#? ?$1=.*|$1=$2|" "$ENV_FILE"; else echo "$1=$2" >> "$ENV_FILE"; fi
}

REGION="$(env_get S3_REGION)"; REGION="${REGION:-ap-south-1}"
UPLOADS_DIR="$(env_get UPLOADS_DIR)"; UPLOADS_DIR="${UPLOADS_DIR:-/opt/hunhar/uploads}"
export AWS_DEFAULT_REGION="$REGION"

echo "==> 1/5 Checking access to s3://$BUCKET ($REGION)"
if ! aws s3api head-bucket --bucket "$BUCKET" 2>/tmp/hunhar-s3-err; then
  cat /tmp/hunhar-s3-err
  echo
  echo "Cannot reach the bucket. Check:"
  echo "  - the bucket name and region (S3 console)"
  echo "  - EC2 -> instance -> Actions -> Security -> Modify IAM role: hunhar-ec2"
  echo "  - the role has the policy from deploy/ec2/aws/uploads-iam-policy.json"
  exit 1
fi
probe="uploads/.hunhar-write-test-$(date +%s)"
echo "ok" | aws s3 cp - "s3://$BUCKET/$probe" --sse AES256 --only-show-errors
aws s3 cp "s3://$BUCKET/$probe" - --only-show-errors >/dev/null
aws s3 rm "s3://$BUCKET/$probe" --only-show-errors
echo "   list / write / read / delete OK"

echo "==> 2/5 Copying existing files from $UPLOADS_DIR"
if [ -d "$UPLOADS_DIR" ] && [ -n "$(find "$UPLOADS_DIR" -type f -not -name '.*' -print -quit)" ]; then
  count="$(find "$UPLOADS_DIR" -type f -not -name '.*' | wc -l)"
  aws s3 sync "$UPLOADS_DIR" "s3://$BUCKET/uploads/" --sse AES256 --exclude ".*" --only-show-errors
  echo "   $count file(s) are in s3://$BUCKET/uploads/"
else
  echo "   no local files — nothing to copy"
fi

echo "==> 3/5 Turning S3 on in $ENV_FILE"
env_set STORAGE_TYPE s3
env_set S3_BUCKET "$BUCKET"
env_set S3_REGION "$REGION"
chown hunhar:hunhar "$ENV_FILE"; chmod 600 "$ENV_FILE"

echo "==> 4/5 Restarting project-service (records still marked LOCAL keep loading from disk)"
systemctl restart hunhar@project-service
for _ in $(seq 1 90); do
  health="$(curl -fs -m 10 http://127.0.0.1:8082/actuator/health || true)"
  if echo "$health" | grep -q '"fileStorage":{"status":"UP"'; then
    echo "   project-service is UP and stores files in s3://$BUCKET"
    UP=1
    break
  fi
  if echo "$health" | grep -q '"fileStorage":{"status":"DOWN"'; then
    echo "   File storage is DOWN:"; echo "$health" | grep -o '"fileStorage":{[^}]*}[^}]*}'
    exit 1
  fi
  sleep 2
done
if [ "${UP:-0}" != 1 ]; then
  echo "   project-service did not come up — see: journalctl -u hunhar@project-service -n 100 --no-pager"
  exit 1
fi

echo "==> 5/5 Pointing the database records at S3"
if mysql -N -B -e "SELECT 1 FROM theunoia_project.stored_files LIMIT 1" >/dev/null 2>&1; then
  moved=0; missing=0
  while IFS= read -r path; do
    [ -n "$path" ] || continue
    # Paths look like 2026-11-04/<uuid>.png; anything else is skipped
    [[ "$path" =~ ^[0-9-]+/[0-9a-fA-F-]+\.[A-Za-z0-9]+$ ]] || { echo "   skipped odd path: $path"; continue; }
    if [ -f "$UPLOADS_DIR/$path" ]; then
      mysql -e "UPDATE theunoia_project.stored_files SET storage='S3' WHERE storage='LOCAL' AND storage_path='$path'"
      moved=$((moved + 1))
    else
      missing=$((missing + 1))
    fi
  done < <(mysql -N -B -e "SELECT storage_path FROM theunoia_project.stored_files WHERE storage='LOCAL'")
  echo "   $moved record(s) now point at S3"
  [ "$missing" -gt 0 ] && echo "   $missing record(s) had no file on disk (already missing before) — left as they were"
else
  echo "   no file records yet (fresh install)"
fi


echo
echo "Done. All uploads are served from s3://$BUCKET. Local copies are still in $UPLOADS_DIR;"
echo "after checking a few images on the site you can delete them:  sudo rm -rf $UPLOADS_DIR/*"
