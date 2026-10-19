#!/usr/bin/env bash
# A private copy of the stack for one parallel slice, so agents never share ports or data.
#   scripts/dev-slice.sh start <n> [admin]   seed giftpop_slice<n>, start api and web (and admin)
#   scripts/dev-slice.sh stop <n>            stop what start launched (by recorded pid, nothing else)
# Needs Mongo on 127.0.0.1:27017 (run `node e2e/mongo-memory.cjs` once if Docker is not available).
# Ports for slice n: api 4100+n, web 3100+n, admin 3200+n. Logs: test-results/logs/slice<n>-*.log.
set -euo pipefail

cmd="${1:?usage: dev-slice.sh start|stop <n> [admin]}"
n="${2:?slice number, 1 to 9}"
api=$((4100 + n)); web=$((3100 + n)); adm=$((3200 + n))
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
logs="$root/test-results/logs"
pids="$logs/slice$n.pids"
mkdir -p "$logs"

if [ "$cmd" = "stop" ]; then
  if [ -f "$pids" ]; then
    while read -r pid; do kill "$pid" 2>/dev/null || true; done < "$pids"
    rm -f "$pids"
  fi
  echo "slice $n stopped"
  exit 0
fi

export MONGODB_URI="mongodb://127.0.0.1:27017/giftpop_slice${n}?replicaSet=rs0"
export WEB_ORIGIN="http://localhost:$web" ADMIN_ORIGIN="http://localhost:$adm" API_URL="http://localhost:$api"
export PORT="$api" NOTIFICATIONS_WORKER=off UPLOAD_DIR="$logs/slice$n-uploads"
export PUBLIC_ASSET_BASE_URL="http://localhost:$api/v1/assets/files"
export SEED_OWNER_EMAIL="owner@giftpop.test" SEED_OWNER_PASSWORD="dev-owner-password-1"

cd "$root"
pnpm seed > "$logs/slice$n-seed.log" 2>&1
: > "$pids"
nohup pnpm --filter @giftpop/api exec tsx src/server.ts > "$logs/slice$n-api.log" 2>&1 &
echo $! >> "$pids"
nohup pnpm --filter @giftpop/web exec next dev -p "$web" > "$logs/slice$n-web.log" 2>&1 &
echo $! >> "$pids"
if [ "${3:-}" = "admin" ]; then
  nohup pnpm --filter @giftpop/admin exec next dev -p "$adm" > "$logs/slice$n-admin.log" 2>&1 &
  echo $! >> "$pids"
fi

for url in "http://localhost:$api/ready" "http://localhost:$web/"; do
  for _ in $(seq 1 90); do
    curl -fsS -o /dev/null "$url" 2>/dev/null && break
    sleep 2
  done
done
echo "slice $n: web http://localhost:$web  api http://localhost:$api  admin http://localhost:$adm (staff $SEED_OWNER_EMAIL / $SEED_OWNER_PASSWORD)"
