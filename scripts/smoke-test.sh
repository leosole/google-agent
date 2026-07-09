#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "${ROOT_DIR}"

# Use an isolated OpenCode data dir for this smoke test to avoid local DB issues.
export XDG_DATA_HOME="${ROOT_DIR}/.opencode-smoke"

opencode mcp list
opencode run "List the Google Sheets in my Drive."
