#!/usr/bin/env bash
set -euo pipefail

MEILI_HOST="${MEILI_HOST:-http://localhost:7700}"
MEILI_MASTER_KEY="${MEILI_MASTER_KEY:-dev_meili_master_key_change_me}"

echo "Seeding Meilisearch on ${MEILI_HOST}…"

# Example: create an index for saints (adjust to your API-data later)
curl -fsSL -X POST "${MEILI_HOST}/indexes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${MEILI_MASTER_KEY}" \
  -d '{"uid":"saints","primaryKey":"id"}' || true

# Put a tiny doc to verify wiring
curl -fsSL -X POST "${MEILI_HOST}/indexes/saints/documents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${MEILI_MASTER_KEY}" \
  -d '[{"id":"demo-1","name":"Saint George","calendar":"new"}]'

echo "Done."
