#!/bin/bash
# Wait for SQL Server to accept connections, then seed the database.
# Runs inside the mssql/server image alongside sqlcmd.

SA_PASS="${SA_PASSWORD:-HalabjGym_2024!}"
DB_HOST="${DB_SERVER:-db}"
SQLCMD=/opt/mssql-tools18/bin/sqlcmd

echo "[init] Waiting for SQL Server at ${DB_HOST} to be ready..."
for i in $(seq 1 30); do
    $SQLCMD -S "$DB_HOST" -U sa -P "$SA_PASS" -Q "SELECT 1" -b -C > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "[init] SQL Server is ready."
        break
    fi
    echo "[init] Attempt $i/30 — retrying in 3s..."
    sleep 3
done

echo "[init] Running schema.sql..."
$SQLCMD -S "$DB_HOST" -U sa -P "$SA_PASS" -i /docker-entrypoint-initdb.d/schema.sql -C
if [ $? -eq 0 ]; then
    echo "[init] Database initialised successfully."
else
    echo "[init] Schema script failed — check logs."
    exit 1
fi
