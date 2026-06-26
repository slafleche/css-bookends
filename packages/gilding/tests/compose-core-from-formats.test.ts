import {
  type ColorFormatPlugin,
  createColor,
} from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import {
  composeCoreFromFormats,
  createGilding,
  lightningCore,
  type LightningOptions,
  type PostProcessCore,
} from '../src/index';

/**
 * The registry-aware onion proof. Where `compose-core.test.ts` rings a HARD-CODED
 * keyword pre-step around Lightning CSS, this proves the un-hard-coded path: gilding
 * reads the `createColor` registry and runs each registered custom format's OWN
 * declared `fallback` transform in front of the (fully intact) inner Lightning CSS core.
 *
 * The fallback is NOT baked into gilding: adding the format (with its fallback) to the
 * registry is what causes the rewrite. A format with no fallback contributes nothing.
 *
 * Why the proof reads the CSS handed to the inner core (a recording spy delegating to
 * the REAL Lightning CSS core), not only the final string: Lightning canonicalizes
 * colours, so the fallback's literal output may not survive verbatim in the final CSS.
 * We capture the input Lightning received to assert the registry fallback ran in front
 * of it, then assert a Lightning-only transformation on the same run's output.
 */

/*
 * A deliberately contrived POC custom format. `render` emits a NON-standard token
 * (`zoo-color(<animal>)`) that Lightning CSS cannot parse, so there is genuinely
 * something to fall back from. `fallback` is the browser-compat hook calipers now
 * carries: it rewrites each `zoo-color(<animal>)` token to a safe, real CSS colour
 * (flamingo -> pink, etc.). The colour math in `render` is meaningless on purpose; the
 * test only needs the custom token to exist and the fallback to rewrite it.
 */
const ZOO_TO_SAFE: Readonly<Record<string, string>> = {
  flamingo: 'pink',
  panther: 'black',
  swan: 'white',
};

const zooFn: ColorFormatPlugin<'zooFn'> = {
  format: 'zooFn',
  // unbounded + alpha: a wide custom space (values are not meaningful here, POC).
  hasAlpha: true,
  gamut: 'unbounded',
  supportsProbe: null,
  gamutDependent: false,
  srgbFloor: false,
  // POC render: always emit the same non-standard token Lightning cannot understand.
  render: () => 'zoo-color(flamingo)' as never,
  // POC fallback: rewrite each zoo-color(<animal>) token to a safe CSS colour.
  fallback: (css) =>
    css.replace(
      /zoo-color\(([a-z]+)\)/g,
      (match, animal: string) => ZOO_TO_SAFE[animal] ?? match,
    ),
};

/* A second POC format with NO `fallback`, used to prove the path is registry-driven:
 * a format that declares no fallback must contribute no rewrite. */
const muteFn: ColorFormatPlugin<'muteFn'> = {
  format: 'muteFn',
  hasAlpha: true,
  gamut: 'unbounded',
  supportsProbe: null,
  gamutDependent: false,
  srgbFloor: false,
  render: () => 'mute-color(silent)' as never,
  // no `fallback` declared.
};

describe('composeCoreFromFormats - the registry-driven onion ring', () => {
  const targets = [
    'chrome 90',
    'safari 14',
  ];

  it('runs BOTH layers: the REGISTRY-driven fallback AND the inner Lightning CSS core', () => {
    // The registry is built by createColor, NOT a hard-coded map in gilding.
    const myColor = createColor({
      formats: [
        zooFn,
      ],
    });

    // The inner core is the REAL Lightning CSS core, wrapped in a spy that records the
    // CSS handed to it (i.e. the registry fallback's output) before delegating unchanged.
    let seenByInner = '';
    const recordingLightning: PostProcessCore<LightningOptions> = {
      name: lightningCore.name,
      finish(css, evergreen, options) {
        seenByInner = css;
        return lightningCore.finish(css, evergreen, options);
      },
    };

    // Build the core straight from the registry; gilding reads `.fallback` off it.
    const core = composeCoreFromFormats(
      myColor.formats,
      recordingLightning,
    );
    const gild = createGilding({ core, targets });

    const out = gild(
      '.a { color: zoo-color(flamingo); background: oklch(0.7 0.1 200); }',
    );

    // (a) the REGISTRY-driven fallback ran IN FRONT OF the inner core: the custom
    // `zoo-color(flamingo)` token was rewritten to its declared safe value (`pink`)
    // BEFORE Lightning saw it, and the custom token was gone from Lightning's input.
    expect(seenByInner).toMatch(/color:\s*pink/);
    expect(seenByInner).not.toContain('zoo-color(flamingo)');

    // (b) the inner Lightning CSS core STILL ran on that same input: the wide-gamut
    // oklch() was downleveled into multiple `background:` declarations, including a
    // display-p3 step (a transformation only the core does).
    const backgroundDecls = out.match(/background:/g) ?? [];
    expect(backgroundDecls.length).toBeGreaterThan(1);
    expect(out).toMatch(/background:\s*(#|rgb)/);
    expect(out).toContain('display-p3');
  });

  it('is registry-driven: a format with NO fallback contributes no rewrite', () => {
    // muteFn declares no `fallback`, so its custom token must reach Lightning untouched
    // (and Lightning, not understanding it, leaves it as an unknown value).
    const onlyMute = createColor({
      formats: [
        muteFn,
      ],
    });

    let seenByInner = '';
    const recordingLightning: PostProcessCore<LightningOptions> = {
      name: lightningCore.name,
      finish(css, evergreen, options) {
        seenByInner = css;
        return lightningCore.finish(css, evergreen, options);
      },
    };

    const core = composeCoreFromFormats(
      onlyMute.formats,
      recordingLightning,
    );

    // No fallback in the whole registry: composeCoreFromFormats adds no ring, so it
    // hands back the inner core verbatim (the honest no-op composition).
    expect(core).toBe(recordingLightning);

    const gild = createGilding({ core, targets });
    gild('.a { color: mute-color(silent); }');
    // the custom token reached Lightning unchanged: nothing rewrote it.
    expect(seenByInner).toContain('mute-color(silent)');
  });

  it('rewrites only formats that declare a fallback when several are registered', () => {
    // zooFn HAS a fallback, muteFn does NOT. The mixed registry must rewrite only the
    // zoo token, proving the rewrite is sourced per-format from the registry.
    const mixed = createColor({
      formats: [
        zooFn,
        muteFn,
      ],
    });

    let seenByInner = '';
    const recordingLightning: PostProcessCore<LightningOptions> = {
      name: lightningCore.name,
      finish(css, evergreen, options) {
        seenByInner = css;
        return lightningCore.finish(css, evergreen, options);
      },
    };

    const core = composeCoreFromFormats(
      mixed.formats,
      recordingLightning,
    );
    const gild = createGilding({ core, targets });
    gild(
      '.a { color: zoo-color(flamingo); border-color: mute-color(silent); }',
    );

    // zoo token rewritten (it had a fallback), mute token left as-is (it did not).
    expect(seenByInner).toMatch(/color:\s*pink/);
    expect(seenByInner).not.toContain('zoo-color(flamingo)');
    expect(seenByInner).toContain('mute-color(silent)');
  });

  it('names itself honestly from the registry fallbacks it found', () => {
    const myColor = createColor({
      formats: [
        zooFn,
      ],
    });
    const core = composeCoreFromFormats(myColor.formats);
    // honest about both the composition and that the ring came from the registry.
    expect(core.name).toBe(
      'compose(registry-fallback(zooFn), lightningcss)',
    );
  });
});

/**
 * The DEFAULT path (plain Lightning core, no registry) must be unchanged: gilding with
 * no custom core still runs Lightning CSS only, and a custom zoo token it does not
 * understand is NOT rewritten (there is no registry fallback to do it).
 */
describe('default gilding path is unchanged (no registry involved)', () => {
  const targets = [
    'chrome 90',
  ];

  it('still downlevels oklch under old targets with no registry layer', () => {
    const gild = createGilding({ targets });
    const out = gild('.a { color: oklch(0.7 0.15 200); }');
    const colorDecls = out.match(/color:/g) ?? [];
    expect(colorDecls.length).toBe(2);
    expect(out).toMatch(/color:\s*(#|rgb)/);
  });

  it('leaves a custom zoo token untouched on the default path (no fallback applied)', () => {
    const gild = createGilding({ targets });
    const out = gild('.a { color: zoo-color(flamingo); }');
    // without the registry pre-step, nothing rewrites the custom token to `pink`.
    expect(out).toContain('zoo-color(flamingo)');
    expect(out).not.toMatch(/color:\s*pink/);
  });
});
