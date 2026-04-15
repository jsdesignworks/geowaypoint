#!/usr/bin/env sh
# Create apps/web/.env.local from .env.example when missing (never overwrites).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$ROOT/apps/web"
EXAMPLE="$WEB/.env.example"
TARGET="$WEB/.env.local"

if [ ! -f "$EXAMPLE" ]; then
  echo "Missing $EXAMPLE" >&2
  exit 1
fi

if [ -f "$TARGET" ]; then
  echo "Already exists: $TARGET (not overwriting). Edit it or remove it to re-copy from .env.example."
  exit 0
fi

cp "$EXAMPLE" "$TARGET"
echo "Created $TARGET — replace placeholders with your Supabase and integration keys."
