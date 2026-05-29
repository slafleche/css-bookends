# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets).

Each book in `packages/*` is versioned and published independently. To record a
change, run `pnpm changeset`, pick the affected package(s) and the bump type, and
write a short summary. The release workflow turns accumulated changesets into
version bumps, changelogs, and npm publishes.
