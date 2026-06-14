# Agent guide — composer-plugins

A pnpm + moon monorepo of community plugins for DXOS Composer. Each plugin is `packages/<name>/`
(its own `package.json`, `dx.yml`, `vite.config.ts`, `src/`). All plugins share one DXOS SDK version
via the `dxos` catalog in `pnpm-workspace.yaml`.

**Always test your work after each step.** If unsure how to implement something, ask — and when you
ask an a-or-b question, number the options.

## Build / dev

- `pnpm install`, then `moon run :build` (typecheck + `vite build` + manifest). `moon run <name>:dev`
  to dev-serve one plugin (e.g. `moon run excalidraw:dev`); `moon run :build` builds all.
- Toolchain (node/pnpm/moon) is pinned in `.prototools` — run `proto install` once.
- Run the linter at natural stopping points.

## Dependencies

- External dependency versions are managed in the pnpm catalogs (`pnpm-workspace.yaml`).
- `@dxos/*` resolve from the **`dxos`** named catalog (`catalog:dxos`). **Never hand-edit the `dxos`
  catalog** — use `node scripts/set-sdk.mjs`. The SDK ships as one unit and moves in lockstep.
- Add a shared external dep with `pnpm add --filter <plugin> --save-catalog <package>`; plugin-only
  deps can be added directly to that plugin's `package.json`.
- When editing `pnpm-workspace.yaml`, preserve the comments.

## Code style

- TypeScript, single quotes. Prefer functional programming and arrow functions.
- Import order: builtin → external → `@dxos` → internal → parent → sibling (blank line between groups).
  Inline type imports: `import { type Foo } from 'bar'`. Max line 120, trailing commas, JSX single quotes.
- Avoid single-letter variable names (`space`, not `s`). Avoid default exports unless required. Prefer
  ES `#private` over the TypeScript `private` keyword in new code.
- Use the `Options` suffix for constructor/function option-bag types (not `Opts`/`Props`/`Config`).
- JSDoc public functions; comments end with a period. Comments state **why** the code is necessary (the
  invariant/constraint it satisfies) — never narrate the change, reference a conversation, or use
  before/after framing ("we used to…", "rather than X we now Y").
- **When moving code, don't leave compatibility re-exports/shims behind** — update every call site in
  the same change.
- React: arrow-function components, TailwindCSS, proper event-handler types. Import React symbols as
  named imports (`useMemo`, `type Ref` — not `React.useMemo`); name a forwarded ref `forwardedRef`.

## Don't cast to fix type errors

Fix the type at its source (inference, signature, generic), not the call site that surfaced it. A red
typecheck is a finding, not something to paper over.

- "Cast" = `as T`, `as any`, `as unknown as T`, non-null `!`, or a widened/`any` signature added to
  silence the checker. `as const` is **not** a cast (it narrows a literal) — always fine.
- Casts are acceptable only at genuine type-system boundaries (external/untyped data, deliberate
  coercions) and must carry a one-line comment saying why no typed alternative exists.

## Common DXOS patterns

- Logging: `import { log } from '@dxos/log'` — structured metadata, `log.info('msg', { key })`.
- Assertions: `import { invariant } from '@dxos/invariant'` — `invariant(cond, 'message')`.
- Error handling: Effect-TS patterns where applicable.

## Testing

- Place tests next to the module as `module.test.ts`. Use vitest with `describe`/`test` (not `it`),
  and prefer `test('foo', ({ expect }) => ...)`.
- Test the public API (the plugin's exported surface / capabilities), not private internals. Prefer
  extending an existing suite over adding a fragmented new one.

## Changesets — add one in every PR that changes a plugin

A changeset is a markdown file in `.changeset/`. **Write the file directly** (deterministic; don't rely
on the interactive `pnpm changeset`). Create `.changeset/<short-kebab-summary>.md`:

```markdown
---
"dxos-plugin-excalidraw": patch
---

One-line, user-facing summary of the change.
```

- Key = the plugin's `package.json` **`name`** (one line per plugin touched).
- Bump: `patch` = fix/refactor/dep bump (no API/behavior change) · `minor` = new backward-compatible
  feature · `major` = backward-incompatible change.
- **Skip it** for non-plugin changes (repo tooling, CI, root docs, tests). Don't hand-write the
  coordinated SDK bump — that's `scripts/changeset-all.mjs`.

## Releasing

Releases are cut by promoting `main` → the `release` branch (see [RELEASING.md](./RELEASING.md) for the
full flow and the SDK upgrade train). **`main` never publishes.**

## Conventions

- New packages must be `"private": true` (plugins publish to the registry via `dx registry publish`,
  not npm).
- PR titles use Conventional Commits: `feat(excalidraw): …`, `fix: …`, `refactor: …`, `docs: …`.
- Before committing, run `git status` and account for every modified/untracked file.
