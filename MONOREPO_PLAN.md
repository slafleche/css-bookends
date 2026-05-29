# CSS-Bookends Monorepo Plan

How CSS-Bookends is structured: one monorepo as the source of truth, each "book"
published independently to npm, and the established books mirrored out to their
own standalone repos with their own releases.

## Principles

1. **Source of truth is this monorepo.** All development happens here.
2. **Each book publishes independently to npm.** Consumers install one book
   without pulling the rest.
3. **`css-calipers` keeps its identity.** It stays published under the unscoped
   name `css-calipers` so its existing downloads, npm page, and shared links are
   never lost. It is the deliberate exception.
4. **New books are scoped** under `@css-bookends/*` (namespaced to the org,
   no name-squatting, grouped on the org page).
5. **Standalone repos are read-only mirrors.** Code flows out of the monorepo,
   never back in.

## Layout (pnpm workspaces)

```
css-bookends/
  pnpm-workspace.yaml
  package.json            # root, private, never published
  .changeset/
    config.json
  packages/
    calipers/             # -> npm "css-calipers"  (unscoped)
    media-queries/        # -> npm "@css-bookends/media-queries"
    spacing/              # -> npm "@css-bookends/spacing" (padding + margin)
    colour/               # -> npm "@css-bookends/colour"
    borders/              # -> npm "@css-bookends/borders"
  .github/
    workflows/
      ci.yml              # test all packages on PR + push
      release.yml         # Changesets: version + publish to npm
      mirror.yml          # split packages out to standalone repos
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
```

Root `package.json` (private, so it never publishes):

```json
{
  "name": "@css-bookends/root",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "changeset": "changeset",
    "version": "changeset version",
    "release": "pnpm -r build && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0"
  }
}
```

## Naming and publish access

| Package dir            | npm name                     | scope     | access note |
| ---------------------- | ---------------------------- | --------- | ----------- |
| `packages/calipers`    | `css-calipers`               | unscoped  | public by default |
| `packages/media-queries` | `@css-bookends/media-queries` | scoped | needs explicit public access |
| `packages/spacing`     | `@css-bookends/spacing`      | scoped    | needs explicit public access |

Scoped packages publish as **private by default**. Each scoped package needs:

```json
"publishConfig": { "access": "public" }
```

(or `changeset publish` with the global `access: "public"` in the Changesets
config, below).

## Internal dependencies

Books that depend on each other use the `workspace:*` protocol. For example,
`packages/media-queries/package.json`:

```json
"dependencies": {
  "css-calipers": "workspace:*"
}
```

During publish, pnpm/Changesets rewrites `workspace:*` to the real version range,
so the published package depends on a normal semver range, not the workspace
alias. Locally, the two are linked live, so you develop both at once.

## Changesets (independent versioning + publishing)

Setup:

```bash
pnpm add -Dw @changesets/cli
pnpm changeset init
```

`.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "fixed": [],
  "linked": [],
  "ignore": []
}
```

Flow:

1. Make a change in one or more packages.
2. Run `pnpm changeset`, pick the affected packages and the bump (patch/minor/
   major), and write a one-line summary. This creates a markdown file in
   `.changeset/`.
3. Merge to `main`. The release workflow opens a "Version Packages" PR that
   applies the bumps and updates each package's CHANGELOG.
4. Merging that PR publishes only the changed packages to npm, each under its
   own name and version.

`css-calipers` reaching `1.0.0` is just a `major` changeset on that one package;
the others stay on their own `0.x` line.

`.github/workflows/release.yml`:

```yaml
name: Release
on:
  push:
    branches: [main]
permissions:
  contents: write
  pull-requests: write
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          registry-url: "https://registry.npmjs.org"
      - run: pnpm install --frozen-lockfile
      - uses: changesets/action@v1
        with:
          version: pnpm version
          publish: pnpm release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Split-mirror CI (standalone repos)

Each established book is mirrored to its own repo (for example
`slafleche/css-calipers`), which keeps its URL, stars, issues, and gets its own
git tags / GitHub Releases. The mirror is **read-only**: it receives code from
the monorepo and is never edited directly.

npm publishing stays single-source (the monorepo, via Changesets). The mirror is
for git presence and releases only, not a second npm publish.

`.github/workflows/mirror.yml` (runs after a release tag is created):

```yaml
name: Mirror books to standalone repos
on:
  push:
    tags:
      - "css-calipers@*"
jobs:
  split-calipers:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: symplify/monorepo-split-github-action@v2.3.0
        with:
          package_directory: "packages/calipers"
          repository_organization: "slafleche"
          repository_name: "css-calipers"
          branch: "main"
          tag: ${{ github.ref_name }}
        env:
          GITHUB_TOKEN: ${{ secrets.MIRROR_TOKEN }}
```

Notes:

- `symplify/monorepo-split-github-action` splits one package directory (with
  history) and pushes it plus the tag to the target repo. `splitsh/lite` is the
  lower-level alternative if more control is needed.
- `MIRROR_TOKEN` is a personal access token with push rights to the target
  repos. The default `GITHUB_TOKEN` cannot push to a different repository.
- Add one job per book that has a standalone repo. New `@css-bookends/*` books
  that do not need a standalone repo simply skip the mirror.

## Migration steps (high level)

1. Convert the root to a private workspace root (the current placeholder package
   becomes either a real book or is retired; the org name is already reserved).
2. Move `css-calipers` source into `packages/calipers`, keeping its
   `package.json` name `css-calipers` and continuing its version line (currently
   `0.14.0`).
3. Extract `mediaQueries` into `packages/media-queries` as
   `@css-bookends/media-queries`, depending on `css-calipers` via `workspace:*`.
   Ship a `css-calipers` release that deprecates the old `css-calipers/mediaQueries`
   subpath and points to the new package.
4. Add Changesets, the release workflow, and the mirror workflow.
5. Point the standalone `slafleche/css-calipers` repo at the mirror output
   (archive its current contents or let the split overwrite `main`).

## Gotchas

- Scoped packages are private unless `access: public` is set.
- `workspace:*` must be rewritten on publish (Changesets/pnpm handle this; do
  not publish with the literal `workspace:*` range).
- Never publish the same package from both the monorepo and a mirror.
- Keep mirrors read-only to avoid two-way sync conflicts.
- Use a modern Node (22/24) in CI. pnpm has its own lockfile, which sidesteps the
  npm lockfile/platform issues that can break `npm ci` across environments.
