# ==============================================================================
# Multi-stage Dockerfile for THEUNOiA Microservices
# Usage:
#   docker build --build-arg SERVICE_NAME=api-gateway -t theunoia/api-gateway:latest .
#   docker build --build-arg SERVICE_NAME=identity-service -t theunoia/identity-service:latest .
#   docker build --build-arg SERVICE_NAME=project-service -t theunoia/project-service:latest .
#   docker build --build-arg SERVICE_NAME=billing-service -t theunoia/billing-service:latest .
#   docker build --build-arg SERVICE_NAME=engagement-service -t theunoia/engagement-service:latest .
# ==============================================================================

# Stage 1: Builder
FROM eclipse-temurin:17-jdk-jammy AS builder
WORKDIR /workspace

# Copy maven wrapper and parent pom
COPY pom.xml .
COPY common-lib common-lib
COPY api-gateway api-gateway
COPY identity-service identity-service
COPY project-service project-service
COPY billing-service billing-service
COPY engagement-service engagement-service

# Build all modules and layer extraction
RUN apt-get update && apt-get install -y maven && \
    mvn clean package -DskipTests

ARG SERVICE_NAME
WORKDIR /workspace/${SERVICE_NAME}/target
RUN java -Djarmode=layertools -jar ${SERVICE_NAME}-1.0.0.jar extract

# Stage 2: Production Minimal JRE
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Add non-root application user
RUN addgroup --system theunoia && adduser --system --ingroup theunoia theunoia
USER theunoia:theunoia

ARG SERVICE_NAME
COPY --from=builder /workspace/${SERVICE_NAME}/target/dependencies/ ./
COPY --from=builder /workspace/${SERVICE_NAME}/target/spring-boot-loader/ ./
COPY --from=builder /workspace/${SERVICE_NAME}/target/snapshot-dependencies/ ./
COPY --from=builder /workspace/${SERVICE_NAME}/target/application/ ./

ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
