#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="${ROOT_DIR}/.logs/workspace-mcp.log"

if [[ ! -f "${LOG_FILE}" ]]; then
  echo "No log file found at ${LOG_FILE}."
  echo "Start the server first: ./scripts/start-workspace-mcp.sh"
  exit 1
fi

URL="$(grep -Eo 'https://accounts\.google\.com/o/oauth2/auth[^[:space:]]+' "${LOG_FILE}" | tail -n 1 || true)"

if [[ -z "${URL}" ]]; then
  echo "No authorization URL found in log yet."
  echo "Trigger an MCP call that requires auth, then run this script again."
  exit 2
fi

echo "Open this URL in your browser to sign in:"
echo "${URL}"
