---
name: scaffold-package
description: Scaffold a new CSS-Bookends package (a lexicon or a book) with the standard dual CJS/ESM build, eslint, tests, and notes. Use when creating a new package directory under lexicons/, books/, or the root.
---

# scaffold-package

Every package mirrors the same layout. The simplest path is to copy an existing
peer (`lexicons/spacing` for a lexicon, `books/transforms` for a book) and rename.

## Decide first

- **lexicon or book?** A lexicon is *primitives for CSS use*; a book is a *workable
  library for one concern*, built from three pages (see `authoring-a-book`).
- **location:** lexicons -> `lexicons/<name>`, books -> `books/<name>`, shared
  machinery -> repo root (like `bookpress`). Root packages must be added to
  `pnpm-workspace.yaml` (`lexicons/*` and `books/*` are globbed; root names are not).

## Files (copy from a peer, then edit)

- `package.json` : name `@css-bookends/<name>`; `publishConfig.access: public`;
  dual `main`/`module`/`types` + `exports`; the standard `build` / `test` scripts.
- `tsconfig.json`, `tsconfig.build.cjs.json`, `tsconfig.build.esm.json`
- `eslint.config.js` : one line re-exporting the shared flat config,
  `module.exports = require('@css-bookends/eslint-config')();` (pass
  `{ ignores: [...] }` only to override the default ignore globs). Do NOT
  copy a full config or re-list the eslint plugins.
- `scripts/emit-esm-package.mjs` (writes `dist/esm/package.json` = `{"type":"module"}`)
- `src/index.ts` re-exporting the package surface
- `tests/runtime/<name>.src.test.ts`
- `notes.md` capturing known debt / improvement ideas

## Dependency conventions

- A book/lexicon peer-depends on `@css-bookends/css-calipers` and any consumed
  lexicon: `peerDependencies` use `workspace:^`, plus the same packages as
  `devDependencies` with `workspace:*` (so the workspace resolves a single shared
  copy, preserving calipers' branded-type identity).
- Lint deps are just `eslint` + `@css-bookends/eslint-config` (`workspace:*`) as
  `devDependencies`. The shared config owns `typescript-eslint` and the import /
  promise / unused-imports plugins, so don't add those per package.
- No per-package Prettier config. The repo root owns `.prettierrc.json` /
  `.prettierignore` (markdown is intentionally ignored); run `pnpm format` from
  the root.
- No `@/` (app) imports. No CSS compiler in a core package (see the
  compiler-agnostic rule in `authoring-a-book`).

## Verify

```sh
pnpm install                                  # register the package in the workspace
pnpm --filter @css-bookends/<name> test       # build + vitest + tsc --noEmit + eslint
```

`test` must be green (build, runtime tests, typecheck, lint) before moving on.
