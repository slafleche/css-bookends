# Testing css-calipers

This document describes how tests are organized and how to run them during
development.

## Test runner

- Tests use [Vitest](https://vitest.dev/).
- The main entrypoint is:

  ```bash
  npm test
  ```

## What tests cover

- Core behavior in `src/` (especially `src/core.ts` and helpers) via
  `tests/core.test.ts`.
- Error behavior and messages for the main operations and helpers.
- Basic coverage for all unit families (percent, absolute, font-relative,
  viewport, container, angle, time, frequency, resolution, flex).

## Conventions

- Keep tests “unit-ish” and cheap:
  - No network calls.
  - No git or `npm` commands.
  - No reliance on built artifacts in `dist/` (those belong in separate, more
    integration-style tests if needed).
- Prefer importing from `../src` in tests, mirroring how `src/index.ts` re-exports
  the public API.
- Name tests descriptively and assert both behavior and relevant error payloads
  (including operation names and context when applicable).

## Coverage

- Coverage reporting is handled by Vitest’s coverage integration.
- You can run coverage manually with:

  ```bash
  npx vitest run --coverage
  ```

