#!/usr/bin/env bash
set -e

# generate redis config from env
REDIS_CONF=/etc/redis.conf
cat > "$REDIS_CONF" <<EOF
bind 127.0.0.1
port ${REDIS_PORT:-6379}
dir /data
save ""
appendonly no
requirepass ${REDIS_PASSWORD:-mysecretpassword}
protected-mode yes
tcp-keepalive 300
EOF

# start redis in background (no daemonize so it will run as child)
# but we background it so we can start node
redis-server "$REDIS_CONF" &

REDIS_PID=$!

# give redis a tiny moment to start (or implement a wait loop)
sleep 0.5

# optional: check redis started
if ! redis-cli -a "${REDIS_PASSWORD}" ping >/dev/null 2>&1; then
  echo "[docker-start] Redis failed to start"
  tail -n +1 /var/log/redis || true
  kill $REDIS_PID || true
  exit 1
fi

echo "[docker-start] Redis started (pid $REDIS_PID). Starting Node..."

# start Node and forward logs to docker
exec node index.js
