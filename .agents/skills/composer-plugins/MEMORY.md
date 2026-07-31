# composer-plugins — session memory

Session-logged learnings and corrections. Newest section first. See `SKILL.md` for the durable rules.

## 2026-07-31 — tictactoe

- A plugin's Tailwind classes are dead unless the plugin compiles its own stylesheet — Composer's CSS
  scans only the dxos monorepo. Fix the pipeline; never route around it with inline styles.
- Never depend on utilities Composer happens to bundle: that set is a by-product of in-repo usage,
  not a contract, and shifts under you. Compile every class the plugin uses; depend only on token
  values, which the host defines at runtime (`@dxos/ui-theme/tokens.css` registers the names).
- `Obj.update`'s callback parameter is already `Obj.Mutable<T>`. An `as Obj.Mutable<typeof x>` cast
  inside it is never load-bearing — it only suppresses the error that the subject is a frozen
  snapshot. Delete the cast and fix the subject.
- Surfaces hand components a **snapshot**. To mutate, resolve the live object from the ref
  (`useResolveRef(game.variant)`); `useObject`'s updater writes through the live object only when it
  is given a ref, and `useResolveRef` passes a non-ref straight through unchanged.
- Check the hooks `@dxos/echo-react` actually exports before reaching for a workaround — `useObject`
  (snapshot + updater), `useObjectValue`, `useResolveRef`, `useObjects`.
- Do not invent utility classes. `max-is-*` / `is-full` do not exist here; the convention is stock
  `max-w-[Nrem]`. Grep for a class before using it — with the CSS gap above, a made-up class and a
  real one fail identically.
- `moon run <pkg>:test` replays a cached pass when inputs are unchanged; a removed build output is
  not an input. Run `npx vitest run` directly when testing whether something works without `dist/`.
- Vite emits the bundle's stylesheet to `out/assets/`, not `out/` or `out/chunks/`.
