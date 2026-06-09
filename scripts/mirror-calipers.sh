#!/usr/bin/env bash
#
# Mirror the calipers lexicon from this monorepo to the standalone
# slafleche/css-calipers repo. Git only, NO npm publish.
#
# The monorepo is the source of truth; the standalone repo is a read-only
# mirror kept for its URL / stars / issues. This pushes a normal commit on top,
# so history is preserved (no force-push, nothing destructive).
#
# Usage:
#   scripts/mirror-calipers.sh --dry-run   # preview the file changes, touch nothing
#   scripts/mirror-calipers.sh             # sync + commit + push
#
set -euo pipefail

# Resolve paths from the script's own location, so it runs from anywhere
# (e.g. `scripts/mirror-calipers.sh` from the repo root). The mirror target is
# the css-calipers repo sitting alongside this monorepo.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$REPO_ROOT/lexicons/calipers"
DEST="$(cd "$REPO_ROOT/.." && pwd)/css-calipers"

[ -d "$SRC" ]       || { echo "ERROR: source missing: $SRC"; exit 1; }
[ -d "$DEST/.git" ] || { echo "ERROR: destination is not a git repo: $DEST"; exit 1; }

# Sync the package contents. --delete makes the mirror match the source, but we
# exclude VCS, the mirror's own .github, installed/built output, and local-only
# files so none of those are clobbered or deleted.
RSYNC_OPTS=(
  -a --delete
  --exclude='.git'
  --exclude='.github'
  --exclude='node_modules'
  --exclude='dist'
  --exclude='coverage'
  --exclude='.DS_Store'
  --exclude='.env.local'
  --exclude='.vercel'
  --exclude='.yarn'
  --exclude='.claude'
)

if [[ "${1:-}" == "--dry-run" ]]; then
  echo "DRY RUN — changes that WOULD be applied to $DEST:"
  rsync "${RSYNC_OPTS[@]}" --dry-run --itemize-changes "$SRC/" "$DEST/"
  echo
  echo "(nothing was written. Re-run without --dry-run to sync + commit + push.)"
  exit 0
fi

echo "Mirroring $SRC -> $DEST ..."
rsync "${RSYNC_OPTS[@]}" "$SRC/" "$DEST/"

# Reset the mirror's .github to exactly what we want: just the funding config.
# The mirror has no CI of its own (the monorepo is the source of truth and runs
# CI); a stale workflow here only produces red Xs against a removed lockfile.
rm -rf "$DEST/.github"
mkdir -p "$DEST/.github"
cp "$REPO_ROOT/.github/FUNDING.yml" "$DEST/.github/FUNDING.yml"

# The mirror's own release tag mirrors the package version, so the standalone
# repo's Releases page stays in step with the monorepo (which holds the canonical
# `@css-bookends/css-calipers@<version>` tag). Tags do not flow through file sync,
# so we set it here explicitly.
VERSION="$(node -p "require('$SRC/package.json').version")"
TAG="v$VERSION"

cd "$DEST"

# This repo is the standalone css-calipers: rewrite the scoped name / docs / repo
# link to the unscoped identity. (`@css-bookends/media-queries` refs are left
# alone, they correctly point at the book.)
npm pkg set name=css-calipers >/dev/null
npm pkg set repository.url="git+https://github.com/slafleche/css-calipers.git" >/dev/null
npm pkg delete repository.directory >/dev/null 2>&1 || true
for f in README.md README_MEASUREMENT.md; do
  [ -f "$f" ] && sed -i '' 's#@css-bookends/css-calipers#css-calipers#g' "$f"
done

git add -A
if git diff --cached --quiet; then
  echo "No file changes to mirror."
else
  git commit -m "Mirror calipers from css-bookends monorepo"
  git push origin main
  echo "Mirrored files pushed."
fi

if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  echo "Tag $TAG already exists on the mirror; leaving it."
else
  git tag "$TAG"
  git push origin "$TAG"
  echo "Tagged mirror $TAG and pushed."
fi
echo "Done."
