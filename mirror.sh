#!/usr/bin/env bash
# Root convenience wrapper for the calipers mirror.
#   ./mirror.sh --dry-run   # preview, writes nothing
#   ./mirror.sh             # sync + commit + push to the css-calipers repo
exec "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/scripts/mirror-calipers.sh" "$@"
