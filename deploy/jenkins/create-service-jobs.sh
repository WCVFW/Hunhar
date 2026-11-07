#!/usr/bin/env bash
# =============================================================================
# Creates the Jenkins "Microservices" tab: one job per part of Hunhar (svc-identity-service, ...),
# each with ACTION = status / restart / stop / start. Safe to run again (updates the jobs).
#
#   sudo bash create-service-jobs.sh /path/to/deploy/ec2/service-job.Jenkinsfile
#
# Needs Jenkins configured by configure-jenkins-shared.sh (CLI login in /var/lib/jenkins/secrets/cli-auth).
# =============================================================================
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "Run with sudo."; exit 1; }
TEMPLATE="${1:?give the path to service-job.Jenkinsfile}"
JH=/var/lib/jenkins
cli() { sudo -u jenkins java -jar "$JH/jenkins-cli.jar" -s http://127.0.0.1:8091/ -http -auth "@$JH/secrets/cli-auth" "$@"; }

TARGETS=(identity-service project-service billing-service engagement-service api-gateway all-backend nginx mysql)
declare -A WHAT=(
  [identity-service]="Login, sign-up, profiles, KYC, admin users"
  [project-service]="Projects, bids, workspace, file uploads, disputes"
  [billing-service]="Wallet, payments, credits, invoices, withdrawals"
  [engagement-service]="Chat, notifications, calendar, FAQ, analytics"
  [api-gateway]="Every API call (the website itself still loads)"
  [all-backend]="All 5 services, one at a time"
  [nginx]="Website + HTTPS + this Jenkins page (status / restart only)"
  [mysql]="The database (every service needs it)"
)

TMP="$(mktemp -d)"; chmod 755 "$TMP"
JOBS=()
for t in "${TARGETS[@]}"; do
  job="svc-$t"
  JOBS+=("$job")
  sed "s/@@SERVICE@@/$t/" "$TEMPLATE" > "$TMP/script"
  TARGET="$t" DESC="${WHAT[$t]}" python3 - "$TMP/script" "$TMP/$job.xml" <<'PY'
import os, sys
from xml.sax.saxutils import escape
script = open(sys.argv[1]).read()
desc = f"{os.environ['DESC']}. Build with Parameters → ACTION = status / restart / stop / start."
open(sys.argv[2], "w").write(f"""<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job">
  <description>{escape(desc)}</description>
  <keepDependencies>false</keepDependencies>
  <properties/>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps">
    <script>{escape(script)}</script>
    <sandbox>true</sandbox>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>
""")
PY
  chown jenkins "$TMP/$job.xml"
  if cli get-job "$job" >/dev/null 2>&1; then cli update-job "$job" < "$TMP/$job.xml"; else cli create-job "$job" < "$TMP/$job.xml"; fi
  # First run registers the ACTION / CONFIRM_STOP parameters (it only shows status)
  if ! sudo test -d "$JH/jobs/$job/builds/1"; then cli build "$job" -s >/dev/null 2>&1 || true; fi
  echo "   $job"
done

# The "Microservices" tab
{
  echo "<?xml version='1.1' encoding='UTF-8'?>"
  echo "<hudson.model.ListView>"
  echo "  <name>Microservices</name>"
  echo "  <description>Start, stop, restart or check each part of Hunhar on its own. Open a job → Build with Parameters.</description>"
  echo "  <filterExecutors>false</filterExecutors><filterQueue>false</filterQueue><properties class=\"hudson.model.View\$PropertyList\"/>"
  echo "  <jobNames><comparator class=\"java.lang.String\$CaseInsensitiveComparator\"/>"
  for j in "${JOBS[@]}" hunhar-service-control; do echo "    <string>$j</string>"; done
  echo "  </jobNames>"
  echo "  <jobFilters/>"
  echo "  <columns><hudson.views.StatusColumn/><hudson.views.WeatherColumn/><hudson.views.JobColumn/><hudson.views.LastSuccessColumn/><hudson.views.LastFailureColumn/><hudson.views.LastDurationColumn/><hudson.views.BuildButtonColumn/></columns>"
  echo "  <recurse>false</recurse>"
  echo "</hudson.model.ListView>"
} > "$TMP/view.xml"
chown jenkins "$TMP/view.xml"
if cli get-view Microservices >/dev/null 2>&1; then cli update-view Microservices < "$TMP/view.xml"; else cli create-view < "$TMP/view.xml"; fi
rm -rf "$TMP"
echo "Microservices tab: http://<server-ip>:8090/view/Microservices/"
