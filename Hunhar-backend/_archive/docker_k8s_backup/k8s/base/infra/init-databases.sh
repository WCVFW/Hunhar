#!/bin/bash
# Creates one database + one least-privilege login role per microservice (database-per-service).
# Runs once on first PostgreSQL start (docker-entrypoint-initdb.d) and is reused by the
# Kubernetes init Job. Password for <svc> comes from <SVC>_DB_PASSWORD (default: <svc>_pass).
set -euo pipefail

SERVICES="auth user project credit payment messaging notification community content analytics file"

for svc in $SERVICES; do
  db="${svc}_db"
  role="${svc}_user"
  var="$(echo "${svc}" | tr '[:lower:]' '[:upper:]')_DB_PASSWORD"
  pass="${!var:-${svc}_pass}"

  echo "Provisioning ${db} / ${role}"
  psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname postgres <<-SQL
    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${role}') THEN
        CREATE ROLE ${role} LOGIN PASSWORD '${pass}';
      ELSE
        ALTER ROLE ${role} WITH LOGIN PASSWORD '${pass}';
      END IF;
    END
    \$\$;
    SELECT 'CREATE DATABASE ${db} OWNER ${role}'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${db}')\gexec
    REVOKE ALL ON DATABASE ${db} FROM PUBLIC;
    GRANT CONNECT, TEMPORARY ON DATABASE ${db} TO ${role};
SQL
  # the service role owns its schema objects; nobody else can read them
  psql -v ON_ERROR_STOP=1 --username "${POSTGRES_USER}" --dbname "${db}" <<-SQL
    ALTER SCHEMA public OWNER TO ${role};
    REVOKE ALL ON SCHEMA public FROM PUBLIC;
    GRANT ALL ON SCHEMA public TO ${role};
SQL
done
echo "All service databases provisioned"
