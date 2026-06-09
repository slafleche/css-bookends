#!/usr/bin/env bash
# Root convenience wrapper for the full release (build + test + npm + mirror).
#   ./release.sh
exec "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/scripts/release-all.sh" "$@"
