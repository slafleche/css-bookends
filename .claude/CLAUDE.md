# CSS-Bookends architecture rules

This is the canonical architecture. It is ABSOLUTE. The same statement lives in
`AGENTS.md`, the package READMEs, and the skills, keep them in sync.

## The three layers

A typed-CSS stack in three layers. Each has one job. Keep them strictly separated.

### Layer 1, css-calipers = typed CSS input PRIMITIVES only

- THE RULE (absolute): ALL typed CSS input VALUES go in calipers, FULL STOP, regardless
  of how rich the value's surface is. That includes `color`, `m`, `i`, `f`, `r`. The
  ONLY test is "is it a typed input value?" If yes, it belongs in calipers. Colour's
  size and complexity (parse, modify, format escalation, custom formats) is NOT a reason
  to question it, that is all the value's own surface, exactly like `m`'s units and
  arithmetic. Do not re-litigate whether colour belongs here; it does.
- Mission: fill the gap where `csstype` is lacking, typed, build-time-validated CSS
  input VALUES. It MUST be usable STANDALONE, by someone who wants only typed CSS
  inputs and no helpers at all.
- Contains: the primitives and the machinery they need, and nothing else. `m()`
  measurements, `r()` ratios, `i()` integers, `f()` floats, `color()` (the colour
  VALUE primitive, including custom-format registration), plus the hardening,
  refinement, and factory support those primitives require.
- MUST NOT contain: any helper, any book, any composed concern, or the `publishBook`
  / self-publish engine. No book code lives in calipers, ever.
- GRANULAR IMPORTS: all typed-input CODE lives in calipers (one package), but a consumer
  MUST be able to import only the part they want, e.g. `m()` without pulling in colour
  and its `culori` dependency. Provide per-primitive subpath exports; colour + culori
  load ONLY when the colour entry is imported. The root stays the all-in-one convenience.

### Layer 2, css-bookends = the helpers (books) that consume the primitives

- Mission: helpers built ON TOP of calipers primitives, to turn typed inputs into
  something useful. CSS-Bookends is the helper layer.
- EVERY helper is a book. Per-property helpers (opacity, zIndex, fontWeight, ...) and
  composed helpers (borders, shadows, margin, padding, ...) are ALL Layer-2 books
  here. A helper NEVER lives in calipers.
- The shelf (`packages/shelf`) is the full bundle: it always re-exports every active
  book (the full "bookends"). The typesetter ingests design tokens (DTCG); gilding is
  the output-edge finisher (browser-compat post-processing).

### Layer 3, css-squire (TBD) = the opinionated framework on top

- An opinionated layer built on the steady calipers + bookends foundation, adaptable
  per project. In theory you could rebuild Tailwind or Bootstrap on top of it.
- Not built yet (TBD). Nothing depends on it.

## Direction of consumption (one-way)

- Books consume calipers; calipers never depends on a book or on `publishBook`. Squire
  builds on calipers + bookends; nothing in the lower layers depends on Squire.
- Design tokens (DTCG) flow IN through the typesetter: tokens -> calipers primitives
  -> books. css-bookends consumes the tokens; calipers itself stays token-unaware.

## css-calipers positioning (README, docs, all public copy)

- NEVER knock or disparage `csstype`. It is loved and used as a DEPENDENCY. Frame
  calipers as COMPLEMENTARY to csstype, never a replacement and never a criticism.
- Lead with the gap calipers fills: csstype types the shape of CSS well, but leaves
  gaps for certain typed CSS INPUT values (e.g. a property type allows a bare
  `number` / `string`, so you cannot construct a build-time-validated value). calipers
  fills exactly that gap: typed, validated CSS input values that still satisfy csstype
  on output.
- Keep it SMALL and focused. Trim exhaustive feature dumps; lead with the goal and the
  space it fills, then concise examples, and link to `docs/` for depth. Do not oversell.
- calipers is and stays a STANDALONE library that fills a gap; it must read as complete
  and useful on its own (you never need bookends to use it). Pointing to the larger
  CSS-Bookends project (helpers on top, Layer 2; CSS Squire the opinionated Layer 3) is
  welcome but SECONDARY: a "there is more if you want it" note, never a framing that
  makes calipers feel incomplete without it or subordinate to it.

## css-bookends positioning (README, docs, public copy)

- The dream, in one line: TYPED INPUT and TYPED OUTPUT with a LOOSE MIDDLE. Typed CSS
  input values (calipers) go in, a typed `.css()` output that satisfies csstype comes
  out, and the middle, composing helpers and books, stays flexible and ergonomic. Type
  safety is anchored at the two ends; you are not forced to type every intermediate
  step. That is the whole appeal of the helper layer.
- Bookends is the helper layer that turns those typed inputs into something useful;
  emphasize the typed-ends, loose-middle framing as its reason to exist.

## Factory is the path, with a lazy defaults re-export (absolute)

- Every project's REAL, configurable path is its FACTORY: calipers `createCalipers()` /
  `createColor()` / `createCssValues()`; each bookends book's `publishBook<Name>()`.
  Force consumers through the factory, it is the override seam (rewrite or wrap any step
  onion-style, swap internals, with zero call-site changes; see `AGENTS.md` for the full
  why). Document that why in the package READMEs too, not only `AGENTS.md`.
- ALWAYS also provide a LAZY convenience entry: a single file that calls each factory at
  its DEFAULTS and re-exports the default instances, so a consumer who just wants the
  defaults never has to bind anything.
  - calipers: that entry is `corpus` (re-exports `m` / `r` / `i` / `f` / `color`, each a
    factory-at-defaults instance).
  - bookends: that entry is `compendium` (re-exports every book bound at defaults). It
    REPLACES the old `shelf` / `publishShelf` naming.
- The lazy re-export is a convenience layer ON TOP of the factory, never a replacement:
  configuration still goes through the factory.

## Test-first, always (absolute)

When adding or changing behaviour that needs tests, write the tests FIRST and confirm
they genuinely FAIL against the current code before writing any implementation. The
failing test is the spec.

- NEVER use `it.skip` / `it.todo` / `xit`, or an always-passing assertion as a stand-in.
  A test that never fails proves nothing.
- If you must stub a test before its real assertion exists, make it FAIL on purpose
  (e.g. `expect.fail('not implemented')` or asserting `false`) so it stays RED and
  visible. A deliberately-failing stub is fine; a skipped or todo'd one is not.
- Report test status ACCURATELY: if anything is red (including a deliberate failing
  stub), say so plainly. NEVER report a suite as green, passing, or done while any test
  is failing.
- Confirm the red by running the test (or capturing its failing output) BEFORE writing
  the implementation.
- If the change is partly type-level (e.g. a widened signature that already works at
  runtime via coercion, so a runtime test passes regardless), the failing-first test
  MUST be a TYPE test (`tsd`) that does NOT compile against the old types. A runtime test
  that is green from the start does not validate a type-level change.
- Only once the test is truly red do you implement to make it green.

## Known violation to fix

- The per-property value helpers in `lexicons/calipers/src/css-values/` (opacity,
  zIndex, fontWeight, the `createCssValues` factory, the spec table) are HELPERS
  living inside calipers. They break the rule above and must be extracted OUT of
  calipers into the books layer. Until that extraction lands, treat their presence in
  calipers as known debt: do NOT add any further helpers to calipers, and the
  calipers README / docs must not present them as a permanent calipers feature.
