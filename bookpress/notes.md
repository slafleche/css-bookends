# Notes & improvement ideas — @css-bookends/bookpress

A running list of known debt and ideas for this package.

## Output access per call  (open question)

A bare call renders the `default` output; other outputs are reached via
`book.outputs.<name>(store)`. Whether callers should also pick an output inline
(a `book.foo(raw)` method, or a `{ output }` option) is deliberately left open
until a real book needs it. Decide against a concrete book, not in the abstract.

## storage default  (idea)

`storage` is required today. Many books will pass `(s) => s`. Consider defaulting
it to identity so a press can omit it when input already yields the canonical store.

## Shelf composition  (todo)

`bookPress` makes one book. The project-level composition root (a `shelfFactory`
wiring many books with shared config) is not here yet. Decide whether it belongs
in bookpress or in each project.

## Typing the named outputs  (idea)

`outputs` is `Record<string, ...>`, so output names are not known to the type
system. A generic over the outputs map could give `book.outputs.long` proper
autocomplete and reject unknown `default` names at compile time.
