#!/usr/bin/env bash
# =============================================================================
# Called by deploy/ec2/Jenkinsfile: copies a release file to the live EC2 server and installs it.
#
# Environment (set by Jenkins):
#   EC2_HOST       Elastic IP or host name of the server
#   SSH_KEY        path to the private key (Jenkins "SSH Username with private key" credential)
#   SSH_USER       login user (hunhar, a sudo user on the server)
#   RELEASE_FILE   release/hunhar-release-....tar.gz built by build-release.sh
#   CHECK_PUBLIC   1 = afterwards check https://www.hunhar.in and https://api.hunhar.in
#   KEEP_RELEASES  how many old releases to keep on the server for rollback (default 3)
# =============================================================================
set -euo pipefail

: "${EC2_HOST:?EC2_HOST is not set}"
: "${SSH_KEY:?SSH_KEY is not set}"
: "${RELEASE_FILE:?RELEASE_FILE is not set}"
SSH_USER="${SSH_USER:-hunhar}"
KEEP="${KEEP_RELEASES:-3}"
CHECK_PUBLIC="${CHECK_PUBLIC:-1}"

# Windows agents (Git Bash): Jenkins gives Windows paths
if command -v cygpath >/dev/null 2>&1; then
  SSH_KEY="$(cygpath -u "$SSH_KEY")"
  RELEASE_FILE="$(cygpath -u "$RELEASE_FILE")"
fi
[ -f "$RELEASE_FILE" ] || { echo "Release file not found: $RELEASE_FILE"; exit 1; }
NAME="$(basename "$RELEASE_FILE" .tar.gz)"

SSH_OPTS=(-i "$SSH_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new
          -o ConnectTimeout=20 -o ServerAliveInterval=30 -o BatchMode=yes)
TARGET="$SSH_USER@$EC2_HOST"

echo "==> Connecting to $TARGET"
ssh "${SSH_OPTS[@]}" "$TARGET" "mkdir -p ~/releases && df -h / | tail -1"

echo "==> Uploading $NAME.tar.gz ($(du -h "$RELEASE_FILE" | cut -f1))"
scp "${SSH_OPTS[@]}" "$RELEASE_FILE" "$TARGET:releases/$NAME.tar.gz"

echo "==> Installing on the server"
ssh "${SSH_OPTS[@]}" "$TARGET" bash -s -- "$NAME" "$KEEP" <<'REMOTE'
set -euo pipefail
NAME="$1"
KEEP="$2"
cd ~/releases
if [ ! -f /opt/hunhar/.env ]; then
  echo "This server was never set up. Do the first install by hand once (deploy/ec2/README.md):"
  echo "  sudo bash install.sh --bucket <s3-bucket>   then fill /opt/hunhar/.env"
  exit 1
fi
rm -rf "$NAME"
tar -xzf "$NAME.tar.gz"
if ! sudo bash "$NAME/install.sh"; then
  echo; echo "================ hunhar-doctor (what is wrong) ================"
  sudo hunhar-doctor || true
  exit 1
fi
echo; echo "================ hunhar-doctor ================"
sudo hunhar-doctor || true
# Keep the newest releases for rollback:  sudo bash ~/releases/<older-release>/install.sh
ls -1dt hunhar-release-*/ 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -rf
ls -1t hunhar-release-*.tar.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f
echo "Releases kept on the server:"; ls -1dt hunhar-release-*/
REMOTE

if [ "$CHECK_PUBLIC" = 1 ]; then
  echo "==> Checking the live site"
  check() { # check URL TEXT
    for _ in $(seq 1 12); do
      if curl -fsS -m 15 "$1" 2>/dev/null | grep -q "$2"; then echo "   OK  $1"; return 0; fi
      sleep 5
    done
    echo "   FAILED  $1"
    return 1
  }
  check https://api.hunhar.in/actuator/health '"UP"'
  check https://www.hunhar.in/ '<div id="root">'
fi

echo "==> Live deploy finished: $NAME"
