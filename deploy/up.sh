#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  echo "Missing deploy/.env. Copy .env.example to .env and fill it in first."
  exit 1
fi

docker compose up -d --build
docker compose ps
