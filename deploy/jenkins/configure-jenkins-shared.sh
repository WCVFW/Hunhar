#!/usr/bin/env bash
# =============================================================================
# Configure Jenkins that runs ON the live Hunhar server (after setup-jenkins-server.sh --port 8091):
#   - protects the live site: 4 GB extra swap, small Jenkins heap, builds killed before the site if memory runs out
#   - Jenkins at http://<server-ip>:8090 (nginx -> 127.0.0.1:8091)
#   - admin user "admin" with a random password in /etc/hunhar/jenkins-admin.pass (no setup wizard)
#   - plugins, credentials, and the hunhar-live job (GitHub main -> build -> deploy to this server)
#
#   sudo bash configure-jenkins-shared.sh --public-ip 3.109.241.160
#
# Safe to run again. Prints the GitHub deploy key (a PUBLIC key) to add to the repository.
# =============================================================================
set -euo pipefail

PUBLIC_IP=""
REPO_SSH="git@github.com:WCVFW/Hunhar.git"
while [ $# -gt 0 ]; do
  case "$1" in
    --public-ip) PUBLIC_IP="$2"; shift 2 ;;
    --repo) REPO_SSH="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done
[ "$(id -u)" -eq 0 ] || { echo "Run with sudo."; exit 1; }
[ -n "$PUBLIC_IP" ] || { echo "Give --public-ip <the server's Elastic IP>"; exit 1; }
HERE="$(cd "$(dirname "$0")" && pwd)"
JH=/var/lib/jenkins
JPORT=8091
CLI_URL="http://127.0.0.1:$JPORT/"

echo "==> 1/7 Protect the live site"
if [ ! -f /swapfile2 ]; then
  fallocate -l 4G /swapfile2 && chmod 600 /swapfile2 && mkswap /swapfile2 >/dev/null && swapon /swapfile2
  grep -q '^/swapfile2' /etc/fstab || echo '/swapfile2 none swap sw 0 0' >> /etc/fstab
fi
mkdir -p /etc/systemd/system/hunhar@.service.d /etc/systemd/system/mysql.service.d /etc/systemd/system/jenkins.service.d
# When memory runs out, Linux kills the process with the highest score: make that a Jenkins build, never the site
printf '[Service]\nOOMScoreAdjust=-500\n' > /etc/systemd/system/hunhar@.service.d/20-oom.conf
printf '[Service]\nOOMScoreAdjust=-600\n' > /etc/systemd/system/mysql.service.d/20-oom.conf
cat > /etc/systemd/system/jenkins.service.d/override.conf <<EOF
[Service]
Environment="JENKINS_LISTEN_ADDRESS=127.0.0.1"
Environment="JENKINS_PORT=$JPORT"
Environment="JAVA_OPTS=-Djava.awt.headless=true -Xmx512m -XX:MaxMetaspaceSize=256m -Duser.timezone=Asia/Kolkata -Djenkins.install.runSetupWizard=false -Djava.io.tmpdir=/var/lib/jenkins/tmp"
# Jenkins and every build it starts (Maven, npm) are killed first and run at lower priority than the site
OOMScoreAdjust=800
Nice=10
EOF

echo "==> 2/7 Admin user (random password, root-only copy in /etc/hunhar/jenkins-admin.pass)"
# Ubuntu 25.04+ mounts /tmp in RAM (~1 GB); Jenkins then marks itself offline for "lack of disk space"
mkdir -p /etc/hunhar "$JH/init.groovy.d" "$JH/secrets" "$JH/tmp"
chown jenkins:jenkins "$JH/tmp"
if [ ! -f /etc/hunhar/jenkins-admin.pass ]; then
  openssl rand -base64 18 | tr -d '/+=' > /etc/hunhar/jenkins-admin.pass
  chmod 600 /etc/hunhar/jenkins-admin.pass
fi
install -m 600 -o jenkins -g jenkins /etc/hunhar/jenkins-admin.pass "$JH/secrets/hunhar-admin.pass"
cat > "$JH/init.groovy.d/10-hunhar-security.groovy" <<EOF
import jenkins.model.*
import hudson.security.*
def j = Jenkins.get()
def pass = new File('$JH/secrets/hunhar-admin.pass')
if (pass.exists()) {
    // Also covers a Jenkins whose setup wizard already made "admin" with its one-time password
    def realm = (j.securityRealm instanceof HudsonPrivateSecurityRealm) ? j.securityRealm : new HudsonPrivateSecurityRealm(false)
    def user = hudson.model.User.getById('admin', false)
    if (user == null) {
        realm.createAccount('admin', pass.text.trim())
    } else {
        user.addProperty(HudsonPrivateSecurityRealm.Details.fromPlainPassword(pass.text.trim()))
        user.save()
    }
    j.setSecurityRealm(realm)
    def auth = new FullControlOnceLoggedInAuthorizationStrategy()
    auth.setAllowAnonymousRead(false)
    j.setAuthorizationStrategy(auth)
}
def loc = JenkinsLocationConfiguration.get()
loc.setUrl('http://$PUBLIC_IP:8090/')
loc.save()
j.setNumExecutors(1)
j.save()
EOF
chown -R jenkins:jenkins "$JH/init.groovy.d"

systemctl daemon-reload
systemctl restart mysql
systemctl restart jenkins
for s in identity-service project-service billing-service engagement-service api-gateway; do
  systemctl restart "hunhar@$s"
done

echo "==> 3/7 Jenkins at http://$PUBLIC_IP:8090"
install -m 644 "$HERE/nginx-jenkins-ip.conf" /etc/nginx/sites-available/jenkins-ip.conf
ln -sf /etc/nginx/sites-available/jenkins-ip.conf /etc/nginx/sites-enabled/jenkins-ip.conf
nginx -t -q && systemctl reload nginx

echo "    waiting for Jenkins to start..."
for _ in $(seq 1 120); do
  curl -s -o /dev/null -m 5 "${CLI_URL}login" && break
  sleep 3
done

echo "==> 4/7 Plugins"
curl -s -m 30 -o "$JH/jenkins-cli.jar" "${CLI_URL}jnlpJars/jenkins-cli.jar"
printf 'admin:%s' "$(cat /etc/hunhar/jenkins-admin.pass)" > "$JH/secrets/cli-auth"
chown jenkins:jenkins "$JH/jenkins-cli.jar" "$JH/secrets/cli-auth"; chmod 600 "$JH/secrets/cli-auth"
# -http: the default WebSocket mode is refused because the Jenkins URL is the public :8090 address
cli() { sudo -u jenkins java -jar "$JH/jenkins-cli.jar" -s "$CLI_URL" -http -auth "@$JH/secrets/cli-auth" "$@"; }
# Update-center data can take a minute to arrive on a fresh Jenkins
for _ in $(seq 1 20); do
  cli install-plugin workflow-aggregator git github credentials-binding ssh-credentials plain-credentials \
      timestamper pipeline-stage-view ws-cleanup -deploy >/dev/null 2>&1 && break
  sleep 15
done
cli safe-restart >/dev/null 2>&1 || systemctl restart jenkins
sleep 10
for _ in $(seq 1 120); do
  cli who-am-i >/dev/null 2>&1 && break
  sleep 3
done
cli list-plugins 2>/dev/null | grep -E '^(workflow-aggregator|git|github|credentials-binding|ssh-credentials|timestamper) ' | awk '{print "    plugin " $1 " " $NF}' || echo "    WARNING: plugins not confirmed — check Manage Jenkins -> Plugins"

echo "==> 5/7 Keys: Jenkins -> this server (as hunhar) and Jenkins -> GitHub (read-only deploy key)"
sudo -u jenkins mkdir -p "$JH/.ssh"; chmod 700 "$JH/.ssh"
[ -f "$JH/.ssh/hunhar_deploy" ] || sudo -u jenkins ssh-keygen -q -t ed25519 -N '' -C 'jenkins-deploy-local' -f "$JH/.ssh/hunhar_deploy"
[ -f "$JH/.ssh/github_deploy" ] || sudo -u jenkins ssh-keygen -q -t ed25519 -N '' -C 'jenkins-hunhar-server' -f "$JH/.ssh/github_deploy"
AK=/home/hunhar/.ssh/authorized_keys
PUB="$(cat "$JH/.ssh/hunhar_deploy.pub")"
grep -qF "$PUB" "$AK" || echo "from=\"127.0.0.1,::1\" $PUB" >> "$AK"
chown hunhar:hunhar "$AK"; chmod 600 "$AK"
sudo -u jenkins sh -c "ssh-keyscan -t ed25519,rsa,ecdsa github.com 2>/dev/null >> $JH/.ssh/known_hosts; ssh-keyscan -t ed25519 127.0.0.1 2>/dev/null >> $JH/.ssh/known_hosts; sort -u -o $JH/.ssh/known_hosts $JH/.ssh/known_hosts"
sudo -u jenkins ssh -i "$JH/.ssh/hunhar_deploy" -o BatchMode=yes hunhar@127.0.0.1 'sudo -n true' && echo "    Jenkins can deploy as hunhar (sudo OK)"

echo "==> 6/7 Credentials (keys are read from files; nothing is printed)"
cat > /tmp/hunhar-creds.groovy <<EOF
import com.cloudbees.plugins.credentials.*
import com.cloudbees.plugins.credentials.domains.Domain
import com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey
import org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl
import hudson.util.Secret
def store = SystemCredentialsProvider.getInstance().getStore()
def dom = Domain.global()
def put = { c ->
    def old = store.getCredentials(dom).find { it.id == c.id }
    if (old) store.updateCredentials(dom, old, c) else store.addCredentials(dom, c)
}
def key = { f -> new BasicSSHUserPrivateKey.DirectEntryPrivateKeySource(new File(f).text) }
put(new BasicSSHUserPrivateKey(CredentialsScope.GLOBAL, 'hunhar-ec2-ssh', 'hunhar', key('$JH/.ssh/hunhar_deploy'), '', 'Deploy login: hunhar on this server'))
put(new StringCredentialsImpl(CredentialsScope.GLOBAL, 'hunhar-ec2-host', 'Live server (Jenkins runs on it)', Secret.fromString('127.0.0.1')))
put(new BasicSSHUserPrivateKey(CredentialsScope.GLOBAL, 'github-hunhar', 'git', key('$JH/.ssh/github_deploy'), '', 'GitHub deploy key (read-only) for WCVFW/Hunhar'))
println 'credentials: hunhar-ec2-ssh, hunhar-ec2-host, github-hunhar'
EOF
chown jenkins:jenkins /tmp/hunhar-creds.groovy
cli groovy = < /tmp/hunhar-creds.groovy
rm -f /tmp/hunhar-creds.groovy

echo "==> 7/7 Job hunhar-live"
cat > /tmp/hunhar-live.xml <<EOF
<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job">
  <description>Every push to GitHub main: build the release, deploy it to this server, run hunhar-doctor.</description>
  <keepDependencies>false</keepDependencies>
  <properties/>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" plugin="workflow-cps">
    <scm class="hudson.plugins.git.GitSCM" plugin="git">
      <configVersion>2</configVersion>
      <userRemoteConfigs>
        <hudson.plugins.git.UserRemoteConfig>
          <url>$REPO_SSH</url>
          <credentialsId>github-hunhar</credentialsId>
        </hudson.plugins.git.UserRemoteConfig>
      </userRemoteConfigs>
      <branches><hudson.plugins.git.BranchSpec><name>*/main</name></hudson.plugins.git.BranchSpec></branches>
      <doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations>
      <submoduleCfg class="empty-list"/>
      <extensions/>
    </scm>
    <scriptPath>deploy/ec2/Jenkinsfile</scriptPath>
    <lightweight>true</lightweight>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>
EOF
chown jenkins:jenkins /tmp/hunhar-live.xml
if cli get-job hunhar-live >/dev/null 2>&1; then
  cli update-job hunhar-live < /tmp/hunhar-live.xml
else
  cli create-job hunhar-live < /tmp/hunhar-live.xml
fi
rm -f /tmp/hunhar-live.xml
echo "    job: http://$PUBLIC_IP:8090/job/hunhar-live/"

echo
echo "============================================================================="
echo " Jenkins:   http://$PUBLIC_IP:8090      user: admin"
echo " Password:  sudo cat /etc/hunhar/jenkins-admin.pass"
echo
echo " Add this PUBLIC key in GitHub -> WCVFW/Hunhar -> Settings -> Deploy keys -> Add deploy key"
echo " (title: hunhar-server-jenkins, leave 'Allow write access' unticked):"
echo
cat "$JH/.ssh/github_deploy.pub"
echo "============================================================================="
