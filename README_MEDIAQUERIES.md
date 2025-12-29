# CSS-Calipers Media Queries

Build typed, unit-safe media query strings with a small, configurable
builder. The media queries module focuses on feature coverage, not syntax
variants: you supply a typed config object and get a normalized query string.

## Quick start

```ts
import { mPx } from "css-calipers";
import {
  buildMediaQueryString,
  makeMediaQueryStyle,
} from "css-calipers/mediaQueries";

const queries = {
  mobile: { maxWidth: mPx(639) },
  tablet: { minWidth: mPx(640), maxWidth: mPx(1023) },
  desktop: { minWidth: mPx(1024) },
};

const media = makeMediaQueryStyle(queries);

const styles = {
  display: "grid",
  gap: "16px",
  ...media({
    mobile: { gridTemplateColumns: "1fr" },
    tablet: { gridTemplateColumns: "repeat(2, 1fr)" },
    desktop: { gridTemplateColumns: "repeat(4, 1fr)" },
  }),
};
```


## Status and scope

The media queries module ships as a separate entrypoint so it can be
tree-shaken when unused. It aims to cover the CSS media feature set through
typed configuration and a set of composable emitters.

## Core concepts

Media queries are built from a single config object that aggregates feature
groups. The config shape favors full CSS media feature coverage and type safety
over matching every syntax variant. For future or experimental features, you
can extend the feature set with optional custom expansions.

- Core group: media type, min width, max width.
- Dimensions group: width, height, aspect ratio, orientation.
- Resolution group: resolution, min resolution, max resolution.
- Interaction group: hover, any-hover, pointer, any-pointer, update.
- Preferences group: color scheme, reduced motion, reduced data, contrast,
  forced colors.
- Display group: color gamut, dynamic range, inverted colors.
- Environment group: scripting, overflow block, overflow inline.
- Custom group: custom features as raw name/value pairs.

All numeric, unit-bearing values use `IMeasurement` from CSS-Calipers.

## Factory and helpers

For advanced usage, build your own query factory by composing emitters. Each
factory instance can have its own config and extension hooks.

```ts
import { mPx } from "css-calipers";
import {
  createMediaQueryBuilder,
  emitDimensionsFeatures,
} from "css-calipers/mediaQueries";

const buildDimensionsQuery = createMediaQueryBuilder({
  emitBase: emitDimensionsFeatures,
  config: {
    errorHandling: {
      invalidValueMode: "log",
      lintingMode: "allow",
    },
  },
});

const query = buildDimensionsQuery({
  width: mPx(900),
  orientation: "portrait",
});
```

### Helper utilities

The helpers module exposes low-level building blocks:

- `createMediaQueryBuilder`: factory creator for typed query builders.
- `buildMediaQueryFromFeatures`: build a query from a raw feature map.
- `buildMediaQueryString`: default builder that includes all modules.
- `buildMediaQueryStringFromParts`: assemble a query from a media type and
  feature parts.
- `createMediaQueryFeatureEmitter` and `createMediaQueryFeatureEmitterWithTracking`:
  feature emission helpers (the tracking version detects duplicates).

## Feature modules

Each feature group lives in its own module and can be composed as needed.
All modules expose an emitter and a type interface for the config:

### Core

- Fields: `type`, `minWidth`, `maxWidth`
- Emitter: internal to `buildMediaQueryString`

### Dimensions

- Fields: `width`, `height`, `minHeight`, `maxHeight`, `aspectRatio`,
  `minAspectRatio`, `maxAspectRatio`, `orientation`
- Emitter: `emitDimensionsFeatures`

### Resolution

- Fields: `resolutionValue`, `minResolution`, `maxResolution`
- Emitter: `emitResolutionFeatures`

### Interaction

- Fields: `hover`, `anyHover`, `pointer`, `anyPointer`, `update`
- Emitter: `emitInteractionFeatures`

### Preferences

- Fields: `colorScheme`, `reducedMotion`, `reducedData`, `contrast`,
  `forcedColors`
- Emitter: `emitPreferencesFeatures`

### Display

- Fields: `colorGamut`, `dynamicRange`, `invertedColors`
- Emitter: `emitDisplayFeatures`

### Environment

- Fields: `scripting`, `overflowBlock`, `overflowInline`
- Emitter: `emitEnvironmentFeatures`

### Custom features

- Fields: `customFeatures` (map of feature name to string, number, or
  measurement)
- Emitter: `emitCustomFeatures`

Custom features require a non-empty name. Values must be a primitive or a
measurement; any other object value throws.

## Validation behavior

Validation is opt-in via factory configuration and runs when a builder
emits features. It is not a separate test runner and does not depend on build
tools; it runs each time you build a media query.

Validation uses `invalidValueMode`:

- `allow`: skip invalid values without logging.
- `log`: log a warning and continue.
- `throw`: throw an error.

Defaults: `invalidValueMode` is `allow`.
The default validators cover basic guards like min/max comparisons, positive
values, and a few redundancy checks.

## Linting behavior

Linting is about potential redundancy or conflicts, such as duplicate feature
emissions. It is controlled by `lintingMode`:

- `allow`: ignore lint warnings.
- `log`: log a warning and continue.
- `throw`: throw an error.

Defaults: `lintingMode` is `throw`. Duplicate feature emissions are detected
by the tracking emitter and handled according to this mode.

## Custom validation and linting hooks

Each module emitter accepts an optional validator function. That validator
runs during query construction, so you can enforce project-specific rules at
build time. Linting is handled by the same builder config and feature emitter
tracking, so custom emitters can participate in the same linting modes.
Tests typically call the builder with known-bad inputs and assert that log or
throw behavior matches the config.

## Configuration options

Each factory instance may supply a configuration object:

```ts
import { createMediaQueryBuilder } from "css-calipers/mediaQueries";

const build = createMediaQueryBuilder({
  emitBase: () => {},
  config: {
    errorHandling: {
      invalidValueMode: "throw",
      lintingMode: "log",
    },
  },
});
```

## Examples and recipes

### Global screens + component-specific factory (menu example)

```ts
import { mPx } from "css-calipers";
import {
  createMediaQueryBuilder,
  emitDimensionsFeatures,
  emitInteractionFeatures,
  emitPreferencesFeatures,
  emitCustomFeatures,
} from "css-calipers/mediaQueries";

const buildScreenQuery = createMediaQueryBuilder({
  emitBase: (props, helpers) => {
    emitDimensionsFeatures(props, helpers);
    emitPreferencesFeatures(props, helpers);
  },
});

const buildMenuQuery = createMediaQueryBuilder({
  emitBase: (props, helpers) => {
    emitInteractionFeatures(props, helpers);
    emitCustomFeatures(props, helpers);
  },
});

const screenQueries = {
  compact: buildScreenQuery({ maxWidth: mPx(719) }),
  roomy: buildScreenQuery({ minWidth: mPx(720) }),
  reducedMotion: buildScreenQuery({ reducedMotion: "reduce" }),
};

const menuQueries = {
  hoverCapable: buildMenuQuery({ hover: "hover" }),
  reducedTransparency: buildMenuQuery({
    customFeatures: {
      // Real media feature; support varies across browsers.
      "prefers-reduced-transparency": "reduce",
    },
  }),
};

const menuStyles = {
  "@media": {
    [screenQueries.compact]: { gridTemplateColumns: "1fr" },
    [screenQueries.roomy]: { gridTemplateColumns: "repeat(3, 1fr)" },
    [menuQueries.hoverCapable]: { rowGap: "24px" },
    [menuQueries.reducedTransparency]: { backdropFilter: "none" },
    [screenQueries.reducedMotion]: { transitionDuration: "0ms" },
  },
};
```

### Build a query with custom features

```ts
import { mPx } from "css-calipers";
import { buildMediaQueryString } from "css-calipers/mediaQueries";

const query = buildMediaQueryString({
  minWidth: mPx(800),
  customFeatures: {
    "custom-level": 2,
    "min-width": mPx(900),
  },
});
```

### Use a custom builder with a subset of modules

```ts
import { mPx } from "css-calipers";
import {
  createMediaQueryBuilder,
  emitResolutionFeatures,
} from "css-calipers/mediaQueries";

const buildResolutionQuery = createMediaQueryBuilder({
  emitBase: emitResolutionFeatures,
});

const query = buildResolutionQuery({
  minResolution: mPx(192),
});
```

## API reference

Types and core exports:

- `IMediaQueryProps`, `IMediaQueries`, `IMediaQueryStyles`
- `IMediaQueryCore`, `IMediaQueryDimensions`, `IMediaQueryResolutionRange`,
  `IMediaQueryInteraction`, `IMediaQueryPreferences`, `IMediaQueryDisplay`,
  `IMediaQueryEnvironment`, `IMediaQueryCustomFeatures`
- `MediaQueryBuilderConfig`, `MediaQueryBuilderHelpers`
- `MediaQueryInvalidValueMode`, `MediaQueryLintingMode`

Functions:

- `buildMediaQueryString`
- `makeMediaQueryStyle`
- `createMediaQueryBuilder`
- `buildMediaQueryFromFeatures`
- `emitDimensionsFeatures`, `emitResolutionFeatures`, `emitInteractionFeatures`,
  `emitPreferencesFeatures`, `emitDisplayFeatures`, `emitEnvironmentFeatures`,
  `emitCustomFeatures`

## Notes and limitations

- This module models the feature set, not every syntax variation in the CSS
  media queries grammar.
- Raw string queries are best handled by passing a prebuilt string to your
  styling layer. The module is optimized for typed, structured input.
- Media type defaults to `screen` when omitted.
