#!/usr/bin/env bash
# Starts DB, backend and frontend, then opens the site. Ctrl+C stops everything.
set -e
cd "$(dirname "$0")"

[ -f .env ] || { echo "Missing .env (see README)"; exit 1; }
[ -d node_modules ] || npm install
[ -d frontend/node_modules ] || (cd frontend && npm install)

docker compose up -d
echo "Waiting for Postgres..."
until docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done

npx prisma migrate deploy
npx prisma generate

trap 'kill 0' EXIT
npm run start:dev &
(cd frontend && npm run dev) &

echo "Waiting for frontend..."
until curl -s http://localhost:5173 >/dev/null; do sleep 1; done
xdg-open http://localhost:5173 >/dev/null 2>&1 || true

wait
