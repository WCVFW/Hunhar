#!/usr/bin/env bash
# =============================================================================
# Hunhar live server check-up. Installed as /usr/local/bin/hunhar-doctor.
#   sudo hunhar-doctor
# Checks: memory/disk, MySQL, the 5 services, nginx, HTTPS, live URLs, S3 uploads + backups,
# nightly backup, risky .env values, and recent errors in the logs. Never prints secret values.
# Exit code 1 when anything FAILED (Jenkins prints this after a failed deploy).
# =============================================================================
set -uo pipefail
[ "$(id -u)" -eq 0 ] || { echo "Run with sudo:  sudo hunhar-doctor"; exit 1; }

ENV_FILE=/opt/hunhar/.env
FAILS=0; WARNS=0
ok()   { printf '  \033[32mOK\033[0m    %s\n' "$*"; }
warn() { printf '  \033[33mWARN\033[0m  %s\n' "$*"; WARNS=$((WARNS + 1)); }
fail() { printf '  \033[31mFAIL\033[0m  %s\n' "$*"; FAILS=$((FAILS + 1)); }
hdr()  { printf '\n\033[1m%s\033[0m\n' "$*"; }
env_get() { [ -f "$ENV_FILE" ] && grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2- ; }

hdr "Server"
mem_avail=$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo)
[ "$mem_avail" -ge 300 ] && ok "memory available: ${mem_avail} MB" || warn "memory low: ${mem_avail} MB available — consider t3.large"
swap_total=$(awk '/SwapTotal/ {print int($2/1024)}' /proc/meminfo)
[ "$swap_total" -gt 0 ] && ok "swap: ${swap_total} MB" || warn "no swap — re-run setup-server.sh"
disk_used=$(df --output=pcent / | tail -1 | tr -dc '0-9')
if [ "$disk_used" -ge 90 ]; then fail "disk ${disk_used}% full — clean: sudo journalctl --vacuum-size=200M; old ~/releases"
elif [ "$disk_used" -ge 80 ]; then warn "disk ${disk_used}% full"; else ok "disk ${disk_used}% used"; fi
ok "uptime: $(uptime -p)"

hdr "MySQL"
if systemctl is-active --quiet mysql && mysqladmin ping >/dev/null 2>&1; then
  ok "running"
  mysql -N -B -e "SELECT table_schema, ROUND(SUM(data_length+index_length)/1024/1024,1) FROM information_schema.tables WHERE table_schema LIKE 'theunoia\_%' GROUP BY table_schema" 2>/dev/null \
    | while read -r db mb; do ok "$db  ${mb} MB"; done
else
  fail "MySQL is not running — sudo systemctl restart mysql; journalctl -u mysql -n 50"
fi

hdr "Backend services"
for item in identity-service:8081 project-service:8082 billing-service:8083 engagement-service:8084 api-gateway:8080; do
  name="${item%%:*}"; port="${item#*:}"
  if ! systemctl is-active --quiet "hunhar@$name"; then
    fail "$name is $(systemctl is-active "hunhar@$name") — journalctl -u hunhar@$name -n 100 --no-pager"
    continue
  fi
  health="$(curl -s -m 10 "http://127.0.0.1:$port/actuator/health")"
  if echo "$health" | grep -q '^{"status":"UP"'; then
    ok "$name UP (port $port, restarts: $(systemctl show -p NRestarts --value "hunhar@$name"))"
  else
    down="$(echo "$health" | grep -o '"[A-Za-z]*":{"status":"DOWN"' | cut -d'"' -f2 | tr '\n' ' ')"
    fail "$name not healthy${down:+ — DOWN: $down} — curl -s localhost:$port/actuator/health"
  fi
done
storage="$(curl -s -m 10 http://127.0.0.1:8082/actuator/health | grep -o '"fileStorage":{[^}]*}[^}]*}' || true)"
if [ -n "$storage" ]; then
  if echo "$storage" | grep -q '"type":"s3"'; then
    echo "$storage" | grep -q '"status":"UP"' && ok "uploads stored in S3: $(echo "$storage" | grep -o '"bucket":"[^"]*"' | cut -d'"' -f4)" \
      || fail "uploads S3 bucket not usable: $(echo "$storage" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
  else
    warn "uploads stored on this server's disk — move them to S3: sudo hunhar-uploads-to-s3"
  fi
fi

hdr "nginx and HTTPS"
systemctl is-active --quiet nginx && ok "nginx running" || fail "nginx not running — sudo nginx -t; sudo systemctl restart nginx"
nginx -t >/dev/null 2>&1 && ok "nginx config valid" || fail "nginx config error — sudo nginx -t"
cert=$(ls -1 /etc/letsencrypt/live/*/cert.pem 2>/dev/null | head -1)
if [ -n "$cert" ]; then
  end=$(openssl x509 -enddate -noout -in "$cert" | cut -d= -f2)
  days=$(( ( $(date -d "$end" +%s) - $(date +%s) ) / 86400 ))
  names=$(openssl x509 -noout -ext subjectAltName -in "$cert" 2>/dev/null | grep -o 'DNS:[^,]*' | cut -d: -f2 | tr '\n' ' ')
  [ "$days" -ge 14 ] && ok "certificate valid $days more days ($names)" || fail "certificate expires in $days days — sudo certbot renew"
else
  warn "no HTTPS certificate yet — after DNS: sudo certbot --nginx -d hunhar.in -d www.hunhar.in -d api.hunhar.in --redirect"
fi

hdr "Live site (from this server)"
for url in "https://www.hunhar.in/|<div id=\"root\">" "https://api.hunhar.in/actuator/health|\"UP\"" "https://hunhar.in/|"; do
  u="${url%%|*}"; want="${url#*|}"
  body="$(curl -sL -m 10 "$u" 2>/dev/null)"; code="$(curl -s -o /dev/null -m 10 -w '%{http_code}' "$u" 2>/dev/null)"
  if [ -z "$want" ]; then
    [ "$code" = "301" ] || [ "$code" = "200" ] && ok "$u → $code" || warn "$u → ${code:-no answer}"
  elif echo "$body" | grep -q "$want"; then ok "$u"
  else warn "$u not answering correctly (HTTP ${code:-none}) — DNS/HTTPS not set up yet?"; fi
done

hdr "S3 backups"
if [ -f /etc/hunhar/backup.env ]; then
  # shellcheck source=/dev/null
  source /etc/hunhar/backup.env
  export AWS_DEFAULT_REGION="${AWS_REGION:-ap-south-1}"
  if aws s3api head-bucket --bucket "$S3_BUCKET" >/dev/null 2>&1; then
    latest="$(aws s3 ls "s3://$S3_BUCKET/${S3_PREFIX:-mysql-backups}/" 2>/dev/null | sort | tail -1)"
    total="$(aws s3 ls "s3://$S3_BUCKET/${S3_PREFIX:-mysql-backups}/" 2>/dev/null | wc -l)"
    if [ -n "$latest" ]; then
      age_h=$(( ( $(date +%s) - $(date -d "$(echo "$latest" | awk '{print $1" "$2}')" +%s) ) / 3600 ))
      [ "$age_h" -le 26 ] && ok "latest DB backup ${age_h}h old ($total kept): $(echo "$latest" | awk '{print $4}')" \
        || fail "latest DB backup is ${age_h}h old — journalctl -u hunhar-db-backup -n 50"
    else
      warn "no DB backups in s3://$S3_BUCKET yet — test: sudo systemctl start hunhar-db-backup"
    fi
  else
    fail "backup bucket '$S3_BUCKET' not reachable — check /etc/hunhar/backup.env and the IAM role"
  fi
  next="$(systemctl show -p NextElapseUSecRealtime --value hunhar-db-backup.timer 2>/dev/null)"
  systemctl is-active --quiet hunhar-db-backup.timer && ok "backup timer on, next run: ${next:-?}" || fail "backup timer off — sudo systemctl enable --now hunhar-db-backup.timer"
  [ "$(systemctl show -p Result --value hunhar-db-backup.service)" = "success" ] || warn "last backup run did not succeed — journalctl -u hunhar-db-backup -n 50"
else
  fail "/etc/hunhar/backup.env missing — re-run setup-server.sh"
fi

hdr "Settings (/opt/hunhar/.env — values not shown)"
if [ -f "$ENV_FILE" ]; then
  [ "$(env_get PAYMENTS_ALLOW_MOCK)" = "false" ] && ok "real payments only (PAYMENTS_ALLOW_MOCK=false)" || fail "PAYMENTS_ALLOW_MOCK is not false — fake payments possible"
  case "$(env_get RAZORPAY_KEY_ID)" in
    rzp_live_*) ok "Razorpay live key" ;;
    rzp_test_*) warn "Razorpay TEST key — payments are not real" ;;
    *) fail "RAZORPAY_KEY_ID missing" ;;
  esac
  for key in MAIL_PASSWORD GOOGLE_CLIENT_ID RAZORPAY_KEY_SECRET RAZORPAY_WEBHOOK_SECRET ADMIN_EMAIL JWT_SECRET INTERNAL_API_KEY APITXT_API_KEY; do
    v="$(env_get "$key")"
    if [ -z "$v" ]; then warn "$key is empty"
    elif echo "$v" | grep -qiE 'change-me|xxxx|placeholder|1234567890-abcdefg|yourdomain'; then fail "$key still has the example value"
    fi
  done
  [ "$(stat -c %a "$ENV_FILE")" = "600" ] && ok ".env readable only by its owner" || fail ".env permissions too open — sudo chmod 600 $ENV_FILE"
else
  fail "$ENV_FILE missing"
fi

hdr "Errors in the last hour"
for name in identity-service project-service billing-service engagement-service api-gateway; do
  n=$(journalctl -u "hunhar@$name" --since "1 hour ago" --no-pager -o cat 2>/dev/null | grep -cE ' ERROR |Exception' || true)
  if [ "$n" -gt 0 ]; then
    warn "$name: $n error line(s). Last one:"
    journalctl -u "hunhar@$name" --since "1 hour ago" --no-pager -o cat | grep -E ' ERROR |Exception' | tail -1 | cut -c1-220 | sed 's/^/          /'
  else
    ok "$name: no errors"
  fi
done

echo
if [ "$FAILS" -gt 0 ]; then printf '\033[31m%s problem(s), %s warning(s)\033[0m\n' "$FAILS" "$WARNS"; exit 1; fi
printf '\033[32mAll good\033[0m (%s warning(s))\n' "$WARNS"
