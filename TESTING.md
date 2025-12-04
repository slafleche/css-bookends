# Testing CSS-Calipers

This document describes how tests are organized and how to run them during
development.

## Test runner

- Tests use [Vitest](https://vitest.dev/).

### Source-only tests (day-to-day development)

- The main entrypoint for local development is `npm test`, which runs
  `tests/core.test.ts` against the source in `src/` in a watch-friendly mode.
- To run the core suite once in non-watch mode, use `npm run test:core`.

### Build artifact tests (pre-main / pre-release)

- Build artifact tests exercise the compiled outputs under `dist/`:

  ```bash
  npm run test:cjs   # core suite against dist/cjs/index.js
  npm run test:esm   # core suite against dist/esm/index.js
  npm run test:dist  # runs both test:cjs and test:esm against dist
  npm run build:test # build, then run test:core and test:dist
  ```

- These commands expect the corresponding `dist` entrypoints to exist. If a
  build artifact is missing or invalid, they will fail quickly when importing
  from `dist/`.
- CI for `main` runs `npm run test:core`, `npm run build`, `npm run test:dist`,
  and `npm run test:types` as part of the pipeline.
- The release script (`npm run release`) runs the same sequence (core tests,
  build, dist tests, and type tests) before publishing.

### Type-level tests (tsd)

- Type-level tests use [tsd](https://github.com/tsdjs/tsd) to verify the public
  type surface:
  - Constructor `m` and `IMeasurement` unit branding.
  - Unit helpers (for example, `mPx`, `mPercent`) and their branded
    measurement types.
  - `MeasurementString` and the string literal types used to exclude
    CSS-Calipers-emitted CSS strings from keyword unions.
  - Guard and assertion helpers (for example, `isMeasurement`,
    `isPercentMeasurement`, `assertPercentMeasurement`).
- To run the type tests locally, use:

  ```bash
  npm run test:types
  ```

## What tests cover

- Core behavior in `src/` (especially `src/core.ts` and helpers) via
  `tests/core.test.ts`.
- Error behavior and messages for the main operations and helpers.
- Basic coverage for all unit families (percent, absolute, font-relative,
  viewport, container, angle, time, frequency, resolution, flex).
- Build artifact tests reuse the same shared core suite from `tests/core.shared.ts`
  but import from the compiled `dist/cjs` and `dist/esm` entrypoints instead of
  from `../src`.
- Type-level tests cover the type contracts for `IMeasurement`, unit helpers,
  `MeasurementString`, and core guard/assert helpers.

## Conventions

- Keep tests “unit-ish” and cheap:
  - No network calls.
  - No git or `npm` commands.
- Prefer importing from `../src` in source-only tests, mirroring how
  `src/index.ts` re-exports the public API.
- Build artifact tests should be minimal glue around `runCoreTests`, with
  behavior and assertions living in the shared suite.
- Name tests descriptively and assert both behavior and relevant error payloads
  (including operation names and context when applicable).

## Coverage

- Coverage reporting is handled by Vitest’s coverage integration.
- You can run coverage manually with:

  ```bash
  npx vitest run --coverage
  ```
