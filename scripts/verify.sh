#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() {
  printf '\n[verify] %s\n' "$1"
}

warn() {
  printf '\n[verify][warn] %s\n' "$1" >&2
}

fail() {
  printf '\n[verify][error] %s\n' "$1" >&2
  exit 1
}

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    fail "Missing required tool '${cmd}'."
  fi
}

service_exists() {
  local service="$1"
  docker compose config --services | grep -qx "$service"
}

detect_backend_service() {
  if service_exists backend; then
    printf 'backend\n'
    return 0
  fi

  local detected
  detected="$(docker compose config --services | grep -Ei '(backend|api)' | head -n1 || true)"
  if [[ -n "$detected" ]]; then
    printf '%s\n' "$detected"
    return 0
  fi

  return 1
}

wait_for_backend_ready() {
  local service="$1"
  local timeout_seconds="${BACKEND_READY_TIMEOUT_SECONDS:-180}"
  local interval_seconds=2
  local max_attempts=$((timeout_seconds / interval_seconds))
  if [[ "$max_attempts" -lt 1 ]]; then
    max_attempts=1
  fi

  log "Waiting for backend service '${service}' to become ready..."

  local container_id=""
  for ((attempt = 1; attempt <= max_attempts; attempt++)); do
    container_id="$(docker compose ps -q "$service" 2>/dev/null || true)"
    if [[ -n "$container_id" ]]; then
      break
    fi
    sleep "$interval_seconds"
  done

  if [[ -z "$container_id" ]]; then
    fail "Could not resolve running container for service '${service}'."
  fi

  local has_healthcheck
  has_healthcheck="$(docker inspect --format '{{if .Config.Healthcheck}}yes{{else}}no{{end}}' "$container_id" 2>/dev/null || echo "no")"

  if [[ "$has_healthcheck" == "yes" ]]; then
    log "Container healthcheck detected; polling health status."
    for ((attempt = 1; attempt <= max_attempts; attempt++)); do
      local health_status
      health_status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_id" 2>/dev/null || echo "unknown")"
      case "$health_status" in
        healthy)
          log "Backend container reported healthy."
          return 0
          ;;
        unhealthy)
          fail "Backend container reported unhealthy."
          ;;
        *)
          sleep "$interval_seconds"
          ;;
      esac
    done
    fail "Timed out waiting for backend container healthcheck."
  fi

  if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
    fail "Neither curl nor wget is available to probe backend readiness."
  fi

  local base_url="${BACKEND_BASE_URL:-http://localhost:8000}"
  local endpoints=("/health" "/docs" "/openapi.json")

  log "No healthcheck found. Probing HTTP endpoints on ${base_url}."
  for ((attempt = 1; attempt <= max_attempts; attempt++)); do
    local endpoint
    for endpoint in "${endpoints[@]}"; do
      local url="${base_url}${endpoint}"
      if command -v curl >/dev/null 2>&1; then
        if curl --silent --show-error --fail --max-time 2 "$url" >/dev/null; then
          log "Backend reachable at ${url}"
          return 0
        fi
      else
        if wget -qO- --timeout=2 "$url" >/dev/null; then
          log "Backend reachable at ${url}"
          return 0
        fi
      fi
    done
    sleep "$interval_seconds"
  done

  fail "Timed out waiting for backend HTTP readiness on ${base_url}."
}

run_backend_tests() {
  local service="$1"

  log "Running backend tests in service '${service}'."
  if docker compose exec -T "$service" pytest; then
    return 0
  fi

  if docker compose exec -T "$service" sh -lc "command -v pytest >/dev/null 2>&1"; then
    fail "Backend pytest command failed. Fix failing tests before merging."
  fi

  warn "pytest not found in container '${service}'. Trying fallback command: docker compose exec -T ${service} poetry run pytest"
  if docker compose exec -T "$service" poetry run pytest; then
    return 0
  fi

  fail "pytest is unavailable in container '${service}'. Suggested command: docker compose exec -T ${service} poetry run pytest"
}

web_script_exists() {
  local script_name="$1"
  node -e "const fs=require('fs'); const pkg=JSON.parse(fs.readFileSync('apps/web/package.json','utf8')); process.exit(pkg.scripts && Object.prototype.hasOwnProperty.call(pkg.scripts, '${script_name}') ? 0 : 1);" >/dev/null 2>&1
}

DOCKER_STACK_STARTED=0
cleanup() {
  local exit_code=$?
  if [[ "${KEEP_DOCKER_UP:-0}" == "1" ]]; then
    log "KEEP_DOCKER_UP=1, skipping docker compose down."
    return "$exit_code"
  fi

  if [[ "$DOCKER_STACK_STARTED" == "1" ]]; then
    log "Stopping docker compose stack."
    docker compose down --remove-orphans || warn "Failed to stop docker compose stack cleanly."
  fi

  return "$exit_code"
}
trap cleanup EXIT

log "Checking required tools..."
require_command docker
if ! docker compose version >/dev/null 2>&1; then
  fail "Missing 'docker compose' plugin/command."
fi
if ! docker info >/dev/null 2>&1; then
  fail "Docker daemon is not reachable. Start Docker Desktop (or your docker engine) and retry."
fi
require_command pnpm
require_command node
require_command git

log "Starting docker compose stack (detached + build)."
docker compose up -d --build
DOCKER_STACK_STARTED=1

BACKEND_SERVICE="$(detect_backend_service || true)"
if [[ -z "$BACKEND_SERVICE" ]]; then
  fail "No backend service found. Expected 'backend' or a service containing 'backend'/'api'."
fi
log "Using backend service: ${BACKEND_SERVICE}"

wait_for_backend_ready "$BACKEND_SERVICE"

if service_exists backend; then
  run_backend_tests backend
else
  run_backend_tests "$BACKEND_SERVICE"
fi

if [[ ! -d node_modules || ! -f pnpm-lock.yaml ]]; then
  log "Installing workspace dependencies with pnpm (node_modules missing or lockfile missing)."
  pnpm -w install
else
  log "Skipping pnpm install (node_modules and pnpm-lock.yaml already present)."
fi

if web_script_exists lint; then
  log "Running web lint script."
  pnpm --filter @apps/web lint
else
  log "Skipping web lint (no lint script in apps/web/package.json)."
fi

if web_script_exists test:ci; then
  log "Running web test:ci script."
  pnpm --filter @apps/web test:ci
elif web_script_exists test; then
  log "Running web test script."
  pnpm --filter @apps/web test
else
  log "Skipping web tests (no test/test:ci script in apps/web/package.json)."
fi

log "Running docs enforcement check."
bash scripts/check-docs-changes.sh

log "Verification completed successfully."
