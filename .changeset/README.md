# Changesets

This directory is managed by [Changesets](https://github.com/changesets/changesets).

Add a changeset for any plugin you change:

```bash
pnpm changeset
```

Pick the affected plugin(s) and a bump type, and describe the change. On the release branch,
`pnpm version-packages` (`changeset version`) consumes the changesets to bump each plugin's version
and update its `CHANGELOG.md`; the release workflow then republishes the changed plugins to the
registry via `dx registry publish`. An SDK upgrade adds a changeset to every plugin so they release
together. See `RELEASING.md`.
