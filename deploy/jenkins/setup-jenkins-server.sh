#!/usr/bin/env bash
# =============================================================================
# One-time setup of Jenkins for Hunhar on Ubuntu 24.04/26.04 — its own small EC2, or the live server (--port 8090),
# reachable at https://jenkins.hunhar.in so GitHub can call its webhook on every push to main.
#
#   sudo bash setup-jenkins-server.sh --email you@example.com                 # its own server
#   sudo bash setup-jenkins-server.sh --email you@example.com --port 8090     # on the live server (8080 = API gateway)
#
# Installs: Java 21 (Jenkins needs 21+, it also builds the Java 17 backend), Maven, Node.js 22, Git,
# Jenkins LTS (listening on 127.0.0.1 only, port 8080 or --port), nginx in front with HTTPS (certbot), 4 GB swap.
# Before running: DNS A record  jenkins.hunhar.in -> this instance's Elastic IP.
# =============================================================================
set -euo pipefail

DOMAIN="jenkins.hunhar.in"
EMAIL=""
PORT=8080
while [ $# -gt 0 ]; do
  case "$1" in
    --email) EMAIL="$2"; shift 2 ;;
    --domain) DOMAIN="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done
[ "$(id -u)" -eq 0 ] || { echo "Run with sudo."; exit 1; }
HERE="$(cd "$(dirname "$0")" && pwd)"

echo "==> Timezone and 4 GB swap (Maven + Vite builds need memory)"
timedatectl set-timezone Asia/Kolkata
if ! swapon --show | grep -q .; then
  fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Java 21, Maven, Git, nginx, certbot"
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y fontconfig openjdk-21-jdk-headless maven git curl wget \
  nginx certbot python3-certbot-nginx openssh-client ca-certificates

echo "==> Node.js 22"
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
fi

# Port + localhost-only BEFORE the package is installed: its first start must not grab 8080
# (taken by the Hunhar API gateway when Jenkins shares the live server). nginx is the public door.
if [ "$PORT" = 8080 ] && ss -ltn 2>/dev/null | grep -q '127.0.0.1:8080\|\*:8080\|0.0.0.0:8080\|:::8080'; then
  echo "Port 8080 is taken (the Hunhar API gateway?) — re-run with --port 8090"; exit 1
fi
mkdir -p /etc/systemd/system/jenkins.service.d
cat > /etc/systemd/system/jenkins.service.d/override.conf <<EOF
[Service]
Environment="JENKINS_LISTEN_ADDRESS=127.0.0.1"
Environment="JENKINS_PORT=${PORT}"
Environment="JAVA_OPTS=-Djava.awt.headless=true -Xmx1g -Duser.timezone=Asia/Kolkata"
EOF
echo "==> Jenkins LTS (official repository, 2026 signing key)"
mkdir -p /etc/apt/keyrings
wget -qO /etc/apt/keyrings/jenkins-keyring.asc https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key
echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" \
  > /etc/apt/sources.list.d/jenkins.list
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y jenkins

systemctl daemon-reload
systemctl enable jenkins
systemctl restart jenkins

echo "==> nginx for $DOMAIN"
sed -e "s/jenkins.hunhar.in/$DOMAIN/g" -e "s/127.0.0.1:8080/127.0.0.1:$PORT/" "$HERE/nginx-jenkins.conf" > /etc/nginx/sites-available/jenkins.conf
ln -sf /etc/nginx/sites-available/jenkins.conf /etc/nginx/sites-enabled/jenkins.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx

if [ -n "$EMAIL" ]; then
  echo "==> HTTPS certificate"
  if certbot --nginx -d "$DOMAIN" --redirect -m "$EMAIL" --agree-tos -n; then
    echo "   https://$DOMAIN is live"
  else
    echo "   certbot failed — check that $DOMAIN points at this server, then:"
    echo "   sudo certbot --nginx -d $DOMAIN --redirect -m $EMAIL --agree-tos"
  fi
fi

echo "==> Waiting for Jenkins to start"
for _ in $(seq 1 60); do
  [ -f /var/lib/jenkins/secrets/initialAdminPassword ] && break
  sleep 3
done

echo
echo "============================================================================="
echo " Jenkins is installed."
echo " 1. Open https://$DOMAIN  (or http:// until the certificate exists)"
echo " 2. Unlock password:   sudo cat /var/lib/jenkins/secrets/initialAdminPassword"
echo " 3. Install suggested plugins, create your admin user"
echo " 4. Continue with deploy/ec2/JENKINS.md (credentials, job, GitHub webhook)"
echo "============================================================================="
