#!/usr/bin/env bash
#
# Publish the standalone, unscoped `css-calipers` library: the SAME measurement
# code as @css-bookends/css-calipers, under its own name, for people who want only
# measurement and don't care about the rest of CSS-Bookends. The npm twin of the
# git mirror.
#
# It builds the canonical package, copies the build to a temp dir, swaps the
# scoped name + docs to the unscoped `css-calipers`, and publishes that. The
# monorepo's own package.json is never touched. Prompts for an npm OTP.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$REPO_ROOT/lexicons/calipers"

echo "==> Building the canonical calipers package"
pnpm --filter @css-bookends/css-calipers build

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
rsync -a --exclude='.git' --exclude='node_modules' "$SRC/" "$TMP/"

cd "$TMP"

# Swap scoped -> unscoped for the standalone identity (name, docs, repo link).
# Only `@css-bookends/css-calipers` is rewritten; `@css-bookends/media-queries`
# references stay, since they correctly point at the book.
npm pkg set name=css-calipers
npm pkg set repository.url="git+https://github.com/slafleche/css-calipers.git"
npm pkg delete repository.directory >/dev/null 2>&1 || true
for f in README.md README_MEASUREMENT.md; do
  [ -f "$f" ] && sed -i '' 's#@css-bookends/css-calipers#css-calipers#g' "$f"
done

VERSION="$(node -p "require('./package.json').version")"
echo "==> Publishing standalone css-calipers@$VERSION"
npm publish --access public
echo "==> Done: standalone css-calipers@$VERSION published."
