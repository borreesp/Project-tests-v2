#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() {
  printf '[docs-check] %s\n' "$1"
}

fail() {
  printf '[docs-check][error] %s\n' "$1" >&2
  exit 1
}

determine_diff_range() {
  local diff_range=""

  if [[ -n "${GITHUB_BASE_REF:-}" ]]; then
    local base_ref="origin/${GITHUB_BASE_REF}"
    if ! git rev-parse --verify "$base_ref" >/dev/null 2>&1; then
      log "Fetching base branch '${GITHUB_BASE_REF}' for CI diff..."
      git fetch --no-tags origin "${GITHUB_BASE_REF}:${base_ref#origin/}" >/dev/null 2>&1 \
        || git fetch --no-tags origin "${GITHUB_BASE_REF}" >/dev/null 2>&1 \
        || true
    fi
    if git rev-parse --verify "$base_ref" >/dev/null 2>&1; then
      diff_range="${base_ref}...HEAD"
    fi
  fi

  if [[ -z "$diff_range" ]]; then
    if git rev-parse --verify origin/main >/dev/null 2>&1; then
      diff_range="origin/main...HEAD"
    elif git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
      diff_range="HEAD~1...HEAD"
    else
      diff_range="HEAD"
    fi
  fi

  printf '%s\n' "$diff_range"
}

is_code_file() {
  local file="$1"
  printf '%s\n' "$file" | grep -Eq '^(backend/.+(\.py|\.sql)|backend/alembic/.+|backend/.+/migrations/.+|apps/.+\.(ts|tsx|js|jsx)|packages/.+\.(ts|tsx|js|jsx|mjs|cjs))$'
}

DIFF_RANGE="$(determine_diff_range)"
log "Using diff range: ${DIFF_RANGE}"

HAS_UNCOMMITTED_CHANGES=0
if ! git diff --quiet -- || ! git diff --cached --quiet -- || [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
  HAS_UNCOMMITTED_CHANGES=1
fi

if [[ "$HAS_UNCOMMITTED_CHANGES" -eq 1 ]]; then
  log "Detected local uncommitted changes; using HEAD + working tree diff."
  mapfile -t CHANGED_FILES < <(
    {
      git diff --name-only HEAD
      git ls-files --others --exclude-standard
    } | awk 'NF > 0' | sort -u
  )
else
  mapfile -t CHANGED_FILES < <(git diff --name-only "$DIFF_RANGE")
fi

if [[ "${#CHANGED_FILES[@]}" -eq 0 ]]; then
  log "No changes detected in range. Skipping docs enforcement."
  exit 0
fi

CODE_CHANGED=0
CODE_FILES=()
for file in "${CHANGED_FILES[@]}"; do
  if is_code_file "$file"; then
    CODE_CHANGED=1
    CODE_FILES+=("$file")
  fi
done

if [[ "$CODE_CHANGED" -eq 0 ]]; then
  log "No code changes detected in backend/apps/packages/migrations. Skipping docs requirement."
  exit 0
fi

log "Code changes detected in:"
for file in "${CODE_FILES[@]}"; do
  printf '  - %s\n' "$file"
done

if [[ "$HAS_UNCOMMITTED_CHANGES" -eq 1 ]]; then
  mapfile -t NEW_DOCS < <(
    {
      git diff --name-status HEAD
      git ls-files --others --exclude-standard | sed 's/^/A\t/'
    } | awk '$1 == "A" && $2 ~ /^docs\/changes\/[0-9]{4}-[0-9]{2}-[0-9]{2}_.+\.md$/ { print $2 }' | sort -u
  )
else
  mapfile -t NEW_DOCS < <(git diff --name-status "$DIFF_RANGE" | awk '$1 == "A" && $2 ~ /^docs\/changes\/[0-9]{4}-[0-9]{2}-[0-9]{2}_.+\.md$/ { print $2 }')
fi

if [[ "${#NEW_DOCS[@]}" -eq 0 ]]; then
  fail "Code changes require a NEW file in docs/changes/YYYY-MM-DD_short_title.md. Example: docs/changes/2026-02-12_fix_runtime_validation.md"
fi

REQUIRED_HEADERS=(
  "1. CONTEXTO"
  "2. CAMBIOS REALIZADOS"
  "3. IMPACTO EN EL DOMINIO"
  "4. ESTADO DE USO"
  "5. RIESGO DE REFRACTOR FUTURO"
  "6. CONTRATO EXTERNO AFECTADO"
  "7. CHECK DE COHERENCIA"
)

for doc in "${NEW_DOCS[@]}"; do
  if [[ ! -f "$doc" ]]; then
    fail "Document declared as added but not found on disk: $doc"
  fi

  log "Validating required sections in ${doc}"
  for header in "${REQUIRED_HEADERS[@]}"; do
    if ! grep -Fq "$header" "$doc"; then
      fail "Missing header '${header}' in ${doc}. Required structure is defined in AGENTS.md."
    fi
  done
done

log "Documentation enforcement passed."
