# Page composition: overriding without overwriting

A design record for two open bookpress questions:

- **a)** how to override a page (input / storage / output) without overwriting the
  whole thing, and
- **b)** how that mechanism fits into the bookPress (the factory).

Backed by a survey of how mainstream libraries solve the same problem. Sources are
listed once at the bottom; inline pointers reference them by name.

## The problem

`bookPress` resolves overrides replace-only today (`bookPress.ts`):

```
input:   over.input ?? base.input        // whole page swapped
storage: over.storage ?? base.storage    // whole page swapped
outputs: { ...base.outputs, ...over.outputs }  // merge by key; same key overwrites
config:  { ...base.defaults, ...over.config }   // shallow merge
```

So to "accept one extra input shape" you must reimplement the entire input page.
`ARCHITECTURE.md` already promises composable pages ("accept a different or extra
set of shapes, keeping the standard store"), but the mechanism for *extending* a
page (rather than replacing it) does not exist yet.

## What best practice says

**Extend-without-replace is the decorator / "onion" pattern.** A wrapper receives
the base function and decides whether to run before it, after it, or instead of it
(fallback). This is the consistent answer across the decorator and pipeline
literature. (Decorator pattern, Pipeline pattern, Wrap/augment/override.)

**Order is the one thing you must make explicit.** "The order in which you wrap
decorators matters" is the repeated warning. Compose at creation time, driven by
config. (Pipeline pattern, LangChain middleware.)

**The wrap primitive already has a battle-tested shape: the Redux store enhancer**,
`(createStore) => createStore'` — a higher-order function that wraps the creation
step with access to the original. Our proposed `(base) => newPage` is the same
shape applied per page. Redux also settled composition: multiple enhancers compose
right-to-left via `compose`. (Redux store enhancers, Redux compose.)

**Two hook styles, offer the wrapping one.** LangChain splits simple `before_*`
hooks from `wrap_*` hooks (used when you must wrap the whole call). The `(base) =>
page` form covers both: call `base` first = decorator; call `base` in the `else`
= fallback. So the author picks per page; we do not have to choose a default.
(LangChain middleware.)

**Plain values stay a `Partial` merge.** For config / defaults, the sanctioned
pattern is `Partial<T>` + factory merge (override the parts you name, keep the
rest), which is what we already do. Only the *pages* need the enhancer form.
(Mock-factory-pattern, Extendable factory pattern.)

## Decision

1. **Keep pure-replace, add a wrap channel.** A page override may be a page (replace,
   today's behaviour) or `(base) => page` (wrap). Both are sanctioned: replace =
   factory-method override; wrap = decorator / enhancer.
2. **The wrap primitive is the enhancer shape** `(base) => page`, one shape for
   input, storage, and each named output.
3. **Decorator-vs-fallback is the author's choice**, expressed by where they call
   `base` inside the wrapper. bookpress does not impose a default.
4. **Composition order = re-print stacking.** `bookPress(book.press)(...)` is the
   compose step; each re-print adds one onion layer, newest outermost. Document
   this, because order is the #1 decorator footgun.
5. **Config keeps shallow `Partial` merge.** Only pages get the enhancer form.

## Open follow-ups

- Exact `PressOverrides` surface for the wrap channel (a parallel `wrap` field vs.
  a union on the existing page keys) — to be sketched against `types.ts` +
  `bookPress.ts`, weighing the type cost against borders' function-valued outputs.
- How this subsumes the `notes.md` "output access per call" question (once outputs
  can be wrapped + selected, picking an output is just config feeding the pick).

## Sources

- Redux store enhancers: https://deepwiki.com/reduxjs/redux-fundamentals-example-app/4.1-store-enhancers
- Redux `compose()`: https://paulkogel.gitbooks.io/redux-docs/content/docs/api/compose.html
- Decorator pattern is sometimes helpful (Jeremy Miller): https://jeremydmiller.com/2024/04/29/the-decorator-pattern-is-sometimes-helpful/
- The Pipeline design pattern (Guillaume Bonnot): https://medium.com/@bonnotguillaume/software-architecture-the-pipeline-design-pattern-from-zero-to-hero-b5c43d8a4e60
- LangChain custom middleware (wrap vs before hooks): https://docs.langchain.com/oss/python/langchain/middleware/custom
- Wrap, augment, and override functions (dev.to): https://dev.to/alexrustic/wrap-augment-and-override-functions-and-methods-3038
- Extendable factory pattern for React using TypeScript: https://betterprogramming.pub/extendable-factory-pattern-for-react-using-typescript-3298c59fefd8
- Mock-factory-pattern in TypeScript (Partial + factory): https://dev.to/davelosert/mock-factory-pattern-in-typescript-44l9
