#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy .env.example to .env and set values first."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

if [[ -z "${G_CLIENT_ID:-}" ]]; then
  echo "G_CLIENT_ID is missing in .env"
  exit 1
fi

if [[ -z "${EMAIL:-}" ]]; then
  echo "EMAIL is missing in .env"
  exit 1
fi

export GOOGLE_OAUTH_CLIENT_ID="${GOOGLE_OAUTH_CLIENT_ID:-${G_CLIENT_ID}}"
export GOOGLE_OAUTH_CLIENT_SECRET="${GOOGLE_OAUTH_CLIENT_SECRET:-${G_CLIENT_SECRET:-}}"
export USER_GOOGLE_EMAIL="${USER_GOOGLE_EMAIL:-${EMAIL}}"
export MCP_SINGLE_USER_MODE="${MCP_SINGLE_USER_MODE:-true}"

LOG_DIR="${ROOT_DIR}/.logs"
LOG_FILE="${LOG_DIR}/workspace-mcp.log"
mkdir -p "${LOG_DIR}"

echo "workspace-mcp logs: ${LOG_FILE}"

# Use complete tier to expose the full sheets/drive tool surface.
uvx workspace-mcp --transport streamable-http --tools sheets drive --tool-tier complete 2>&1 | tee -a "${LOG_FILE}"
