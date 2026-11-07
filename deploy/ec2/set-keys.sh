#!/usr/bin/env bash
# =============================================================================
# Enter Hunhar's production keys into /opt/hunhar/.env without opening an editor.
# Installed as /usr/local/bin/hunhar-set-keys.     sudo hunhar-set-keys
#
# Asks for each value (secrets are typed/pasted hidden). Press Enter to keep the current value.
# Then restarts only the services that use what changed, one at a time.
# =============================================================================
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "Run with sudo:  sudo hunhar-set-keys"; exit 1; }
ENV_FILE=/opt/hunhar/.env
[ -f "$ENV_FILE" ] || { echo "$ENV_FILE not found"; exit 1; }

current() { grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2- || true; }

set_value() { # set_value KEY  (value in $NEWVAL; any characters are safe)
  local tmp; tmp="$(mktemp)"
  KEY="$1" awk 'BEGIN { k = ENVIRON["KEY"]; v = ENVIRON["NEWVAL"]; done = 0 }
    $0 ~ "^#? ?" k "=" && !done { print k "=" v; done = 1; next }
    { print }
    END { if (!done) print k "=" v }' "$ENV_FILE" > "$tmp"
  cat "$tmp" > "$ENV_FILE"; rm -f "$tmp"
}

changed_identity=0; changed_billing=0
ask() { # ask KEY "Label" secret|plain identity|billing
  local key="$1" label="$2" kind="$3" svc="$4" cur shown val
  cur="$(current "$key")"
  if [ "$kind" = secret ]; then
    if [ -z "$cur" ] || echo "$cur" | grep -qiE 'change-me|xxxx|placeholder'; then shown="not set"; else shown="set, hidden"; fi
    read -r -s -p "  $label [$shown]: " val; echo
  else
    read -r -p "  $label [${cur:-not set}]: " val
  fi
  val="${val%$'\r'}"
  [ -n "$val" ] || return 0
  # .env is read as a Java properties file: a backslash must be written twice
  local bs='\'
  val="${val//"$bs"/"$bs$bs"}"
  NEWVAL="$val" set_value "$key"
  [ "$svc" = identity ] && changed_identity=1
  [ "$svc" = billing ] && changed_billing=1
  return 0
}

echo "Hunhar production keys — press Enter to keep a value. Secrets are not shown while you paste."
echo
echo "Email (OTP for sign-up and password reset)"
ask MAIL_HOST "SMTP host (e.g. smtp.resend.com)" plain identity
ask MAIL_PORT "SMTP port (587)" plain identity
ask MAIL_USERNAME "SMTP username" plain identity
ask MAIL_PASSWORD "SMTP password / API key" secret identity
ask MAIL_FROM "From address (e.g. no-reply@hunhar.in)" plain identity
echo
echo "Google sign-in"
ask GOOGLE_CLIENT_ID "OAuth client ID (…apps.googleusercontent.com)" plain identity
echo
echo "SMS (Fast2SMS)"
ask FAST2SMS_API_KEY "Fast2SMS API key" secret identity
echo
echo "Payments (Razorpay — live keys start with rzp_live_)"
ask RAZORPAY_KEY_ID "Razorpay key ID" plain billing
ask RAZORPAY_KEY_SECRET "Razorpay key secret" secret billing
ask RAZORPAY_WEBHOOK_SECRET "Razorpay webhook secret" secret billing

# Mail health back in /health once a real mail password is set
mp="$(current MAIL_PASSWORD)"
if [ -n "$mp" ] && ! echo "$mp" | grep -qiE 'change-me|xxxx|placeholder'; then
  NEWVAL=true set_value management.health.mail.enabled
fi
chown hunhar-app:hunhar-app "$ENV_FILE"; chmod 600 "$ENV_FILE"

restart() { # restart NAME PORT
  systemctl restart "hunhar@$1"
  for _ in $(seq 1 90); do
    if curl -fs -m 10 "http://127.0.0.1:$2/actuator/health" | grep -q '"UP"'; then echo "  $1 UP"; return 0; fi
    sleep 2
  done
  echo "  $1 NOT UP — a value is probably wrong: journalctl -u hunhar@$1 -n 60 --no-pager"
  return 1
}
echo
if [ "$changed_identity$changed_billing" = "00" ]; then echo "Nothing changed."; exit 0; fi
echo "Restarting the services that use the new values (one at a time)..."
[ "$changed_identity" = 1 ] && restart identity-service 8081
[ "$changed_billing" = 1 ] && restart billing-service 8083
echo "Done. Check everything:  sudo hunhar-doctor"
