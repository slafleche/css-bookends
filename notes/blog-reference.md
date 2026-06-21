# CSS-Bookends / Squire: blog and content reference

Reference material for future blog posts (dev.to) and LinkedIn content. This is
a notes file, not framework documentation. Captured 2026-06-21 from a working
session; verify specifics against the live repo before publishing.

Status legend used below: **shipped** (exists in the repo), **planned** (named
but not built), **hypothesis** (an idea to validate, not yet a claim the project
makes).

## The three-level architecture

### Level 1: Tokens (the lexicons)

Typed primitives for CSS. A lexicon is a set of typed values plus the operations
on them, with minimal dependencies. Lexicons can build on one another.

- `css-calipers` (measurement): **shipped**, 1.0 / stable. The foundational
  lexicon most other pieces build on.
- `color`, `spacing`: **shipped** but early (0.x / experimental).
- `media-queries`: **shipped**, experimental (0.x), built on calipers.

Every lexicon follows the same shape:

1. INPUT: a permissive API that accepts many forms (shorthand, verbose, mixed).
2. STORAGE: normalize every input into one canonical store; all logic runs on
   the store, never on raw input.
3. OUTPUT: `.css()` is the single terminal that emits a string, and it always
   emits valid CSS.

Factory functions, no pre-built instances. Values stay opaque through
composition and only become strings at the edge.

### Level 2: CSS-Bookends

The flexible, low-level kit to build any UI. Override every config, override the
helpers, or write your own. This is the power-user tier.

Design intent: **evergreen**. Levels 1 and 2 will get updates, but the
flexibility is what keeps them long-lived: you extend them rather than replace
them. The honest tradeoff, stated up front: too low-level for people who are
less deep in this than the author, who will reach for something familiar like a
Tailwind-style API.

Books (helpers built on lexicons) such as `borders`, `shadows`, `margin`,
`padding`: **planned**.

### Level 3: CSS-Squire

The opinionated layer on top: utility classes and the familiar conveniences
people expect from a system. The Tailwind-style on-ramp that answers Level 2's
"too low-level" tradeoff. This is the part that is allowed to change and be
opinionated, sitting on the evergreen foundation below it.

## Philosophy

- "Strict at the edges, loose in the middle." Typed tokens in, valid CSS out,
  and how you compose, layer, and organize in between is yours.
- Mistakes surface at authoring time instead of shipping as silent strings. The
  framing the docs lead with: what other ecosystems have and CSS lacks is typed
  input, defined output, and a contract a compiler can enforce.
- Evergreen foundation plus a volatile top is the inverse of the usual framework
  lifecycle. Most frameworks churn and force you to migrate; the bet here is that
  a flexible-enough base is one you extend, not one you throw away.

## Input edge and scope boundary

- The input format is DTCG (the W3C Design Tokens format). A typesetter
  (**planned**, not built) converts a DTCG document into typed lexicon vars that
  feed the helpers. The token-to-helper mapping stays under the consumer's
  control rather than being prescribed.
- Figma extraction is deliberately **out of scope**. The boundary is drawn at
  the standard, not at a proprietary tool.
- Rationale (a clean opinionated stance for a post): a standard evolves in the
  open, versioned and migratable, with a community process you can see coming. A
  wildcard tool that "changes everything" gives no such contract. Anchor to the
  format the industry is converging on and let everything upstream of it be
  someone else's problem.

## Branding and naming

- **CSS-Bookends** (umbrella plus Levels 1 and 2): library theme. Lexicons are
  vocabularies; books are the helpers; bookends hold the set together.
- **CSS-Squire** (Level 3): a lighter medieval wink rather than the heavy book
  analogy. The developer is the knight; the framework is the squire that assists
  you. Storybook-esque branding that links back to CSS-Bookends but carries its
  own separate identity.

## The through-line (the differentiator)

A typed contract means invalid CSS cannot ship silently. The **hypothesis** (not
yet a claim the docs make: the architecture currently says nothing about AI) is
that this makes the framework better for AI-assisted design, because an AI that
emits an invalid token value or a mistyped unit is refused at authoring time
instead of shipping broken CSS.

This bridges directly to the author's existing compiled / typed-CSS LinkedIn
post (AI writes invalid token values like `var(--spacign-md)` or the wrong unit;
a typed system catches it). The planned AI-engineering validation project is what
would turn the hunch into a showable claim, ideally with a concrete metric (AI
generates fewer invalid values, gets it right more often, etc.).

## Candidate post angles (seeds, not drafts)

- The three-level breakdown: tokens, the flexible kit, the opinionated system.
- Typed CSS as guardrails for AI-assisted design (the through-line above).
- Evergreen vs churn: a framework you extend instead of migrate.
- "Anchor to DTCG, not the hype tool," and why Figma extraction is out of scope.
- "Strict at the edges, loose in the middle" as a design stance other tools get
  backwards (opinions in the middle, loose edges).

## Guardrails when these become posts

From the author's writing rules:

- Opinion pieces, not self-promo. The framework is a subtle plug at most; if the
  library disappeared, the argument should still stand.
- Audience split: dev.to is for senior devs (do not over-explain); LinkedIn is
  the HR-friendly, bite-size version. Do not conflate the two.
- Fact-check before publishing. In particular, verify the DTCG industry-buy-in
  claim against primary sources (the spec is still stabilizing), and keep the
  AI-advantage marked as a hypothesis until the validation project backs it.
- No em dashes; Canadian spelling; short sentences.
