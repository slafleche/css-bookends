# Releasing css-calipers

This document describes how to publish a new version of `css-calipers` to npm
using the local release script.

## Prerequisites

- You have push access to the `main` branch of the repository.
- You are logged in to npm with an account that can publish the
  `css-calipers` package (`npm whoami` should work).
- If your npm account uses 2FA, be ready to enter your OTP during
  `npm publish`.

## Release flow (local, scripted)

Releases should be performed via the `release` script rather than calling
`npm publish` directly.

1. Ensure your local `main` branch is up to date.
2. From the project root, run `npm run release`.

3. The script will:
   - Verify that the current branch is `main` (abort otherwise).
   - Warn if there are uncommitted changes and ask whether to continue.
   - Run the unit tests (`npm test`).
   - Run the build (`npm run build`) to produce `dist/cjs` and `dist/esm`.
   - Check that the expected build outputs exist.
   - Prompt you to choose the version bump (`patch`, `minor`, or `major`).
   - Run `npm version <type>` to bump the version and create a tag.
   - Show the new version and ask for final confirmation before publishing.
   - On confirmation, run `npm publish`, which also triggers the
     `prepublishOnly` hook and publishes under the default `latest` dist-tag.

If any step fails (tests, build, or publish), the script will exit with a
non-zero status and print an error message.

## prepublishOnly safety net

The `prepublishOnly` npm script is configured to run:

The `prepublishOnly` hook runs automatically on every `npm publish` and will
block publishing if tests or the build fail.

## Dist-tag strategy

- All releases are currently published with npm’s default `latest` dist-tag.
- There is no separate `next`/`beta` channel yet; if that changes, both this
  document and the release script should be updated to reflect the new
  tagging behavior.

## Notes and future improvements

- Direct `npm publish` is discouraged; prefer `npm run release` so all checks
  run consistently.
- In the future, publishing can be moved to CI (for example, from tags on
  `main`) without changing the core expectations described here.
