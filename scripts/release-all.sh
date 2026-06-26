#!/usr/bin/env bash
#
# Full release for the CSS-Bookends monorepo:
#   1. build every package
#   2. run the full test suite (a failure here aborts the release)
#   3. publish changed packages to npm via Changesets (@css-bookends/css-calipers,
#      shelf, whatever has a version not yet on the registry)
#   4. publish the standalone unscoped `css-calipers` (same code, own name)
#   5. mirror the calipers lexicon to the standalone css-calipers repo (+ tag)
#
# Normal lifecycle:
#   pnpm changeset            # record what changed + the bump
#   pnpm changeset version    # apply the version bumps
#   ./release.sh              # this script: npm + mirror, in one go
#
# Run from anywhere. Publishing prompts for an npm OTP if you have 2FA.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

echo "==> [1/4] Building all packages"
pnpm -r build

echo "==> [2/4] Running the full test suite (aborts the release on any failure)"
pnpm -r test

echo "==> [3/5] Publishing changed packages to npm (Changesets)"
pnpm exec changeset publish

echo "==> [4/5] Publishing the standalone unscoped css-calipers (npm mirror)"
"$SCRIPT_DIR/publish-standalone.sh"

echo "==> [5/5] Mirroring calipers to its standalone repo (git)"
"$SCRIPT_DIR/mirror-calipers.sh"

echo "==> Release complete: tests passed, npm published (scoped + standalone), calipers mirrored."
