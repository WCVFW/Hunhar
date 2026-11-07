#!/usr/bin/env bash
# =============================================================================
# What does this commit range need to deploy? Used by deploy/ec2/Jenkinsfile.
#
#   bash deploy/ec2/detect-changes.sh <last-deployed-commit> <new-commit> [auto|website|backend|everything]
#
# Prints (and nothing else on stdout):
#   SERVICES=<space-separated backend services to rebuild and restart>
#   WEBSITE=0|1
#   SCRIPTS=0|1        server scripts changed (installed, nothing restarted)
#   SUMMARY=<one line for the build description>
#
# Rules (auto):
#   Hunhar-frontend/**                         -> website only (no backend restart)
#   Hunhar-backend/<service>/**                -> that service only
#   Hunhar-backend/common-lib/**, pom.xml      -> all 5 services (they all use them)
#   deploy/ec2/**                              -> scripts only
#   anything else (docs, README, root Jenkinsfile, ...) -> nothing
#   no previous deploy / unknown commit        -> everything
# =============================================================================
set -euo pipefail

BASE="${1:-}"
HEAD="${2:-HEAD}"
SCOPE="${3:-auto}"
ALL="identity-service project-service billing-service engagement-service api-gateway"

emit() { # emit SERVICES WEBSITE SCRIPTS WHY
  local svcs="$1" web="$2" scripts="$3" why="$4" what=()
  [ -n "$svcs" ] && what+=("services: $svcs")
  [ "$web" = 1 ] && what+=("website")
  [ "$scripts" = 1 ] && [ -z "$svcs" ] && [ "$web" = 0 ] && what+=("server scripts")
  echo "SERVICES=$svcs"
  echo "WEBSITE=$web"
  echo "SCRIPTS=$scripts"
  if [ "${#what[@]}" -eq 0 ]; then echo "SUMMARY=nothing to deploy ($why)"; else echo "SUMMARY=$(IFS=';'; echo "${what[*]}") ($why)"; fi
}

case "$SCOPE" in
  everything) emit "$ALL" 1 1 "forced: everything"; exit 0 ;;
  backend)    emit "$ALL" 0 1 "forced: backend"; exit 0 ;;
  website)    emit "" 1 1 "forced: website"; exit 0 ;;
  auto) ;;
  *) echo "Unknown scope: $SCOPE" >&2; exit 1 ;;
esac

if [ -z "$BASE" ] || ! git cat-file -e "$BASE^{commit}" 2>/dev/null; then
  emit "$ALL" 1 1 "first deploy or previous commit unknown"
  exit 0
fi
if [ "$(git rev-parse "$BASE")" = "$(git rev-parse "$HEAD")" ]; then
  emit "" 0 0 "no new commits since the last deploy"
  exit 0
fi

declare -A pick=()
web=0
scripts=0
while IFS= read -r f; do
  case "$f" in
    Hunhar-frontend/*) web=1 ;;
    Hunhar-backend/pom.xml|Hunhar-backend/common-lib/*) for s in $ALL; do pick[$s]=1; done ;;
    Hunhar-backend/*/*)
      svc="${f#Hunhar-backend/}"; svc="${svc%%/*}"
      case " $ALL " in *" $svc "*) pick[$svc]=1 ;; esac ;;
    deploy/ec2/*) scripts=1 ;;
  esac
done < <(git diff --name-only "$BASE" "$HEAD")

svcs=""
for s in $ALL; do [ -n "${pick[$s]:-}" ] && svcs="$svcs $s"; done
emit "${svcs# }" "$web" "$scripts" "changes since ${BASE:0:7}"
