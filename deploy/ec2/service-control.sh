#!/usr/bin/env bash
# =============================================================================
# Start / stop / restart / check one part of Hunhar. Installed as /usr/local/bin/hunhar-service.
# Used by the Jenkins job hunhar-service-control (deploy/ec2/service-control.Jenkinsfile).
#
#   sudo hunhar-service <target> <status|restart|stop|start>
#
# targets: identity-service project-service billing-service engagement-service api-gateway
#          all-backend   (the 5 services, one at a time: backends first, gateway last)
#          nginx         (website + HTTPS + Jenkins proxy: status / restart only — stopping it would cut off Jenkins too)
#          mysql         (the database: every service needs it)
# =============================================================================
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "Run with sudo."; exit 1; }
TARGET="${1:-}"; ACTION="${2:-status}"

declare -A PORT=([identity-service]=8081 [project-service]=8082 [billing-service]=8083 [engagement-service]=8084 [api-gateway]=8080)
ORDER=(identity-service project-service billing-service engagement-service api-gateway)

case "$ACTION" in status|restart|stop|start) ;; *) echo "Action must be status, restart, stop or start"; exit 1 ;; esac

unit_of() { case "$1" in nginx) echo nginx ;; mysql) echo mysql ;; *) echo "hunhar@$1" ;; esac; }

wait_up() { # wait_up NAME — backend health, or the unit being active
  local name="$1"
  if [ -n "${PORT[$name]:-}" ]; then
    for _ in $(seq 1 90); do
      curl -fs -m 10 "http://127.0.0.1:${PORT[$name]}/actuator/health" | grep -q '"UP"' && { echo "   $name  UP"; return 0; }
      sleep 2
    done
    echo "   $name  NOT UP after 3 minutes — journalctl -u hunhar@$name -n 100 --no-pager"; return 1
  fi
  sleep 2
  systemctl is-active --quiet "$(unit_of "$name")" && { echo "   $name  running"; return 0; }
  echo "   $name  NOT running"; return 1
}

show() { # show NAME
  local name="$1" unit; unit="$(unit_of "$name")"
  local state since mem health=""
  state="$(systemctl is-active "$unit" || true)"
  since="$(systemctl show -p ActiveEnterTimestamp --value "$unit")"
  mem="$(systemctl show -p MemoryCurrent --value "$unit")"
  [[ "$mem" =~ ^[0-9]+$ ]] && mem="$((mem / 1024 / 1024)) MB" || mem="-"
  if [ -n "${PORT[$name]:-}" ] && [ "$state" = active ]; then
    curl -fs -m 10 "http://127.0.0.1:${PORT[$name]}/actuator/health" | grep -q '"UP"' && health="health UP" || health="health NOT UP"
  fi
  printf '   %-20s %-9s %-8s since %s  %s\n' "$name" "$state" "$mem" "${since:-?}" "$health"
}

act() { # act NAME
  local name="$1" unit; unit="$(unit_of "$name")"
  case "$ACTION" in
    status) show "$name" ;;
    stop)
      [ "$name" = nginx ] && { echo "Refusing to stop nginx: the website AND this Jenkins would become unreachable. Use restart."; return 1; }
      systemctl stop "$unit"; echo "   $name  stopped" ;;
    start|restart)
      systemctl "$ACTION" "$unit"; wait_up "$name" ;;
  esac
}

case "$TARGET" in
  identity-service|project-service|billing-service|engagement-service|api-gateway|nginx|mysql)
    echo "==> $ACTION $TARGET"; act "$TARGET" ;;
  all-backend)
    echo "==> $ACTION all 5 services (one at a time)"
    rc=0
    if [ "$ACTION" = stop ]; then
      for ((i=${#ORDER[@]}-1; i>=0; i--)); do act "${ORDER[$i]}" || rc=1; done   # gateway first
    else
      for s in "${ORDER[@]}"; do act "$s" || { rc=1; [ "$ACTION" = status ] || break; }; done
    fi
    exit "$rc" ;;
  *) echo "Unknown target '$TARGET'. Use one of: ${ORDER[*]} all-backend nginx mysql"; exit 1 ;;
esac
