#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mode="${1:-all}"
if [[ $# -gt 0 ]]; then shift; fi
case "$mode" in
  go-unit) cd backend; GOCACHE="${GOCACHE:-/tmp/archery-go-build}" go test ./... "$@" ;;
  go-integration) node scripts/test-env.mjs go-integration "$@" ;;
  frontend-unit) cd frontend; npm run test:unit -- "$@" ;;
  browser) cd frontend; npm run test:browser -- "$@" ;;
  e2e) node scripts/test-env.mjs e2e "$@" ;;
  all)
    for suite in go-unit go-integration frontend-unit browser e2e; do
      bash scripts/test.sh "$suite"
    done
    ;;
  *) echo 'usage: bash scripts/test.sh go-unit|go-integration|frontend-unit|browser|e2e|all' >&2; exit 2 ;;
esac
