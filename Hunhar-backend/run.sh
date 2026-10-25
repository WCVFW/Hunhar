#!/usr/bin/env bash
# ==============================================================================
# hunhar.in Backend Native Runner for Linux / macOS / Jenkins (No Docker Required)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ACTION="${1:-start}"
DB_USER="${2:-${DB_USER:-root}}"
DB_PASSWORD="${3:-${DB_PASSWORD:-root}}"

PID_FILE="$SCRIPT_DIR/.hunhar-services.pid"

SERVICES=("identity-service:8081" "project-service:8082" "billing-service:8083" "engagement-service:8084" "api-gateway:8080")

stop_services() {
    echo "[*] Stopping any existing hunhar.in backend services..."
    for item in "${SERVICES[@]}"; do
        PORT="${item#*:}"
        PID=$(lsof -ti :"$PORT" 2>/dev/null || true)
        if [ -n "$PID" ]; then
            echo "  -> Killing PID $PID on port $PORT"
            kill -9 "$PID" 2>/dev/null || true
        fi
    done
    rm -f "$PID_FILE"
    echo "[+] All backend services stopped."
}

case "$ACTION" in
    stop)
        stop_services
        ;;
    status)
        echo "=========================================================="
        echo " hunhar.in Backend Services Status"
        echo "=========================================================="
        for item in "${SERVICES[@]}"; do
            NAME="${item%%:*}"
            PORT="${item#*:}"
            PID=$(lsof -ti :"$PORT" 2>/dev/null || true)
            if [ -n "$PID" ]; then
                echo -e "$NAME\t[ONLINE] (Port $PORT, PID $PID)"
            else
                echo -e "$NAME\t[OFFLINE] (Port $PORT)"
            fi
        done
        ;;
    start|*)
        stop_services

        echo "=========================================================="
        echo " Starting hunhar.in Backend Services (Native Java)"
        echo "=========================================================="

        for item in "${SERVICES[@]}"; do
            NAME="${item%%:*}"
            PORT="${item#*:}"
            JAR_PATH="$SCRIPT_DIR/$NAME/target/$NAME-1.0.0.jar"

            if [ ! -f "$JAR_PATH" ]; then
                echo "JAR not found: $JAR_PATH. Running Maven build..."
                mvn clean package -DskipTests
            fi

            echo "[*] Launching $NAME on port $PORT..."
            nohup java \
                -Dserver.port="$PORT" \
                -DDB_USER="$DB_USER" \
                -DDB_PASSWORD="$DB_PASSWORD" \
                -DSPRING_DATASOURCE_USERNAME="$DB_USER" \
                -DSPRING_DATASOURCE_PASSWORD="$DB_PASSWORD" \
                -Xms128m -Xmx256m \
                -jar "$JAR_PATH" > "$SCRIPT_DIR/$NAME.log" 2>&1 &
            
            PID=$!
            echo "$NAME:$PID" >> "$PID_FILE"
            sleep 2
        done

        echo "[*] Services launched. Checking API Gateway health at http://localhost:8080/actuator/health..."
        for i in {1..20}; do
            STATUS=$(curl -s http://localhost:8080/actuator/health | grep '"status":"UP"' || true)
            if [ -n "$STATUS" ]; then
                echo "[+] API Gateway is UP and database is auto-connected!"
                break
            fi
            sleep 2
        done
        ;;
esac
