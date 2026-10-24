#!/bin/bash
# Give the (non-root) jenkins user access to the host Docker engine, then start Jenkins as jenkins.
# Builds/tests run as jenkins - embedded PostgreSQL used by the integration tests refuses to run as root.
set -e
if [ -S /var/run/docker.sock ]; then
  chmod 666 /var/run/docker.sock
fi
chown -R jenkins:jenkins /var/jenkins_home 2>/dev/null || true
exec gosu jenkins /usr/bin/tini -- /usr/local/bin/jenkins.sh "$@"
