import { describe, expect, it } from 'vitest';

import {
  composeCore,
  createGilding,
  keywordToRgb,
  lightningCore,
  type LightningOptions,
  type PostProcessCore,
} from '../src/index';

/**
 * The onion principle: a composing core adds a custom pre-step IN FRONT OF the inner
 * Lightning CSS core WITHOUT replacing it. Both layers must run over the same input:
 * the custom layer rewrites colour keywords, then Lightning CSS still does its full job
 * (fallbacks, prefixes, minification) on the result.
 *
 * Why the proof reads the CSS handed to the inner core rather than only the final
 * string: Lightning CSS canonicalizes colours (it collapses `rgb(255, 192, 203)` back
 * to the shorter `pink` keyword, `rgb(0, 0, 0)` to `#000`, and so on). So the pre-step's
 * literal rgb() output does not survive in the final string. To assert the pre-step ran
 * concretely we capture the input the inner core received (a recording spy delegating to
 * the REAL Lightning CSS core), then assert a Lightning-only transformation in the same
 * run on the final output. Both rings, same input, real core.
 */
describe('composeCore - the onion ring around Lightning CSS', () => {
  const targets = [
    'chrome 90',
    'safari 14',
  ];

  it('runs BOTH layers: the custom keyword-to-rgb pre-step AND the inner Lightning CSS core', () => {
    // The inner core is the REAL Lightning CSS core, wrapped in a spy that records the
    // CSS it is handed (i.e. the pre-step's output) before delegating to it unchanged.
    let seenByInner = '';
    const recordingLightning: PostProcessCore<LightningOptions> = {
      name: lightningCore.name,
      finish(css, evergreen, options) {
        seenByInner = css;
        return lightningCore.finish(css, evergreen, options);
      },
    };

    const core = composeCore(keywordToRgb, recordingLightning);
    const gild = createGilding({ core, targets });

    const out = gild(
      '.a { color: pink; background: oklch(0.7 0.1 200); }',
    );

    // (a) the custom layer ran IN FRONT OF the inner core: the CSS handed to Lightning
    // CSS had `pink` rewritten to its rgb() form, and the bare keyword was gone.
    expect(seenByInner).toContain('rgb(255, 192, 203)');
    expect(seenByInner).not.toMatch(/color:\s*pink/);

    // (b) the inner Lightning CSS core still ran on that same input: the wide-gamut
    // oklch() was downleveled, producing one or more fallback declarations alongside the
    // modern value (multiple `background:` decls: sRGB floor, display-p3, lab, etc.).
    const backgroundDecls = out.match(/background:/g) ?? [];
    expect(backgroundDecls.length).toBeGreaterThan(1);
    // the fallback floor is a universal sRGB form (hex or rgb); Lightning emits it for
    // older targets that do not understand the wide-gamut oklch().
    expect(out).toMatch(/background:\s*(#|rgb)/);
    // Lightning's wide-gamut lowering is visible: under these targets it expands oklch()
    // into a display-p3 step for capable browsers (a transformation only the core does).
    expect(out).toContain('display-p3');
    // and Lightning's own colour canonicalization is visible: it collapsed the pre-step's
    // rgb(255, 192, 203) back to the shorter `pink` keyword in the final output.
    expect(out).toMatch(/color:\s*pink/);
  });

  it('names itself honestly about the composition', () => {
    const core = composeCore(keywordToRgb);
    expect(core.name).toBe('compose(keyword-to-rgb, lightningcss)');
  });

  it('does not replace the inner core: Lightning CSS is still invoked through it', () => {
    // A pre-step that does nothing, so any transformation in the output must be the
    // inner Lightning CSS core's work.
    const noop = (css: string): string => css;
    const core = composeCore(noop);
    const gild = createGilding({
      core,
      targets: [
        'safari 13',
      ],
    });
    const out = gild('.a { backdrop-filter: blur(4px); }');
    // a Lightning-CSS-only behaviour: the vendor prefix Safari 13 needs.
    expect(out).toContain('-webkit-backdrop-filter');
  });
});

/**
 * The default path (no custom core) must be unchanged: gilding still runs Lightning CSS
 * only, exactly as before this addition.
 */
describe('default gilding path is unchanged (Lightning CSS only)', () => {
  const targets = [
    'chrome 90',
  ];

  it('still downlevels oklch under old targets without any custom layer', () => {
    const gild = createGilding({ targets });
    const out = gild('.a { color: oklch(0.7 0.15 200); }');
    const colorDecls = out.match(/color:/g) ?? [];
    expect(colorDecls.length).toBe(2);
    expect(out).toMatch(/color:\s*(#|rgb)/);
  });

  it('leaves a bare keyword untouched on the default path (no keyword rewrite)', () => {
    const gild = createGilding({ targets });
    const out = gild('.a { color: pink; }');
    // without the custom pre-step, Lightning CSS keeps `pink` as-is.
    expect(out).toContain('pink');
    expect(out).not.toContain('rgb(255, 192, 203)');
  });
});
