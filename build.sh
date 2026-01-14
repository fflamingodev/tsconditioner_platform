#!/usr/bin/env bash
set -euo pipefail

variant="${1:-noauth}"
root="$(cd "$(dirname "$0")" && pwd)"

viteDir="$root/vite-tsconditioner"
goDir="$root/go_tsconditioner"
distDir="$root/dist"

echo "== Build React ($variant) =="
cd "$viteDir"
npm install
if [ "$variant" = "auth" ]; then
  npm run build:auth
else
  npm run build:noauth
fi

echo "== Build Go ($variant) =="
mkdir -p "$distDir/$variant"
cd "$goDir"
if [ "$variant" = "auth" ]; then
  go build -tags auth   -o "$distDir/auth/server"   ./cmd/server
else
  go build -tags noauth -o "$distDir/noauth/server" ./cmd/server
fi

echo "Done."