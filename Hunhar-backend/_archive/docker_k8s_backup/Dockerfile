# syntax=docker/dockerfile:1.7
# One parameterised multi-stage Dockerfile for every microservice of the Maven reactor:
#   docker build --build-arg SERVICE=auth-service -t theunoia/auth-service .
# Stage 1 builds only the requested module (+ common-lib), stage 2 explodes the Spring Boot
# layered jar so dependency layers are cached between releases, stage 3 is a small non-root JRE.

ARG SERVICE

FROM maven:3.9-eclipse-temurin-17 AS build
ARG SERVICE
WORKDIR /workspace
COPY pom.xml .
COPY common-lib common-lib
COPY ${SERVICE} ${SERVICE}
# The reactor lists every module; only the ones present are built thanks to -pl/-am.
RUN --mount=type=cache,target=/root/.m2 \
    sed -i -E "/<module>/{/<module>(common-lib|${SERVICE})<\/module>/!d}" pom.xml && \
    mvn -B -q -pl ${SERVICE} -am package -DskipTests && \
    mkdir -p /workspace/extracted && \
    java -Djarmode=layertools -jar ${SERVICE}/target/${SERVICE}-*.jar extract --destination /workspace/extracted

FROM eclipse-temurin:17-jre-alpine AS runtime
ARG SERVICE
LABEL org.opencontainers.image.title="theunoia-${SERVICE}" \
      org.opencontainers.image.vendor="THEUNOiA" \
      org.opencontainers.image.source="https://github.com/theunoia/theunoia-backend"
RUN addgroup -S -g 1001 app && adduser -S -u 1001 -G app app && apk add --no-cache curl tzdata
ENV TZ=UTC \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"
WORKDIR /app
COPY --from=build --chown=app:app /workspace/extracted/dependencies/ ./
COPY --from=build --chown=app:app /workspace/extracted/spring-boot-loader/ ./
COPY --from=build --chown=app:app /workspace/extracted/snapshot-dependencies/ ./
COPY --from=build --chown=app:app /workspace/extracted/application/ ./
USER 1001
EXPOSE 8080
HEALTHCHECK --interval=20s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -fsS "http://localhost:${PORT:-8080}/actuator/health/liveness" || exit 1
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
