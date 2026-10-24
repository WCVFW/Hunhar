# Pre-configured Jenkins for THEUNOiA: JDK 17 + Maven + Docker CLI/buildx + kubectl + all plugins,
# configured entirely by Configuration-as-Code (no setup wizard, pipeline job created automatically).
FROM jenkins/jenkins:lts-jdk17

USER root

# Build tool chain copied from official images (no curl | sh installers)
COPY --from=maven:3.9-eclipse-temurin-17 /usr/share/maven /usr/share/maven
COPY --from=docker:27-cli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=docker/buildx-bin:latest /buildx /usr/libexec/docker/cli-plugins/docker-buildx
COPY --from=bitnami/kubectl:1.31 /opt/bitnami/kubectl/bin/kubectl /usr/local/bin/kubectl

RUN ln -s /usr/share/maven/bin/mvn /usr/bin/mvn \
 && apt-get update \
 && apt-get install -y --no-install-recommends gosu ca-certificates curl \
 && rm -rf /var/lib/apt/lists/* \
 && git config --system --add safe.directory '*'

COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

COPY casc.yaml /usr/share/jenkins/casc.yaml
COPY entrypoint.sh /usr/local/bin/theunoia-entrypoint.sh
RUN chmod +x /usr/local/bin/theunoia-entrypoint.sh

ENV CASC_JENKINS_CONFIG=/usr/share/jenkins/casc.yaml \
    JAVA_OPTS="-Djenkins.install.runSetupWizard=false -Dhudson.plugins.git.GitSCM.ALLOW_LOCAL_CHECKOUT=true -Xmx1g"

# starts as root only to fix docker.sock permissions, then drops to the jenkins user
ENTRYPOINT ["/usr/local/bin/theunoia-entrypoint.sh"]
