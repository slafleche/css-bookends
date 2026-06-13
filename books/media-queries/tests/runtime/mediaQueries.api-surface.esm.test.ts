import { describe, expect, it } from 'vitest';

const esmMediaQueries = await import('../../dist/esm/index.js');

describe('mediaQueries API surface (ESM)', () => {
  it('exposes expected media queries helpers', () => {
    expect(esmMediaQueries).toHaveProperty('buildMediaQueryString');
    expect(typeof esmMediaQueries.buildMediaQueryString).toBe(
      'function',
    );

    expect(esmMediaQueries).toHaveProperty('makeMediaQueryStyle');
    expect(typeof esmMediaQueries.makeMediaQueryStyle).toBe(
      'function',
    );

    expect(esmMediaQueries).toHaveProperty('createMediaQueryBuilder');
    expect(typeof esmMediaQueries.createMediaQueryBuilder).toBe(
      'function',
    );

    expect(esmMediaQueries).toHaveProperty(
      'buildMediaQueryFromFeatures',
    );
    expect(typeof esmMediaQueries.buildMediaQueryFromFeatures).toBe(
      'function',
    );

    expect(esmMediaQueries).toHaveProperty(
      'buildMediaQueryStringFromParts',
    );
    expect(
      typeof esmMediaQueries.buildMediaQueryStringFromParts,
    ).toBe('function');

    expect(esmMediaQueries).toHaveProperty(
      'createMediaQueryFeatureEmitter',
    );
    expect(
      typeof esmMediaQueries.createMediaQueryFeatureEmitter,
    ).toBe('function');

    expect(esmMediaQueries).toHaveProperty(
      'createMediaQueryFeatureEmitterWithTracking',
    );
    expect(
      typeof esmMediaQueries.createMediaQueryFeatureEmitterWithTracking,
    ).toBe('function');

    expect(esmMediaQueries).toHaveProperty('mediaQueryFactory');
    expect(typeof esmMediaQueries.mediaQueryFactory).toBe('function');

    expect(esmMediaQueries).toHaveProperty('defineMediaQueryModules');
    expect(typeof esmMediaQueries.defineMediaQueryModules).toBe(
      'function',
    );

    expect(esmMediaQueries).toHaveProperty(
      'mediaQueryOutputVanillaExtract',
    );
    expect(
      typeof esmMediaQueries.mediaQueryOutputVanillaExtract,
    ).toBe('function');
    expect(esmMediaQueries).toHaveProperty('outputVanillaExtract');
    expect(typeof esmMediaQueries.outputVanillaExtract).toBe(
      'function',
    );
  });

  it('exposes media query module emitters', () => {
    expect(esmMediaQueries).toHaveProperty('emitCoreFeatures');
    expect(typeof esmMediaQueries.emitCoreFeatures).toBe('function');

    expect(esmMediaQueries).toHaveProperty('emitDimensionsFeatures');
    expect(typeof esmMediaQueries.emitDimensionsFeatures).toBe(
      'function',
    );

    expect(esmMediaQueries).toHaveProperty('emitResolutionFeatures');
    expect(typeof esmMediaQueries.emitResolutionFeatures).toBe(
      'function',
    );

    expect(esmMediaQueries).toHaveProperty('emitInteractionFeatures');
    expect(typeof esmMediaQueries.emitInteractionFeatures).toBe(
      'function',
    );

    expect(esmMediaQueries).toHaveProperty('emitPreferencesFeatures');
    expect(typeof esmMediaQueries.emitPreferencesFeatures).toBe(
      'function',
    );

    expect(esmMediaQueries).toHaveProperty('emitDisplayFeatures');
    expect(typeof esmMediaQueries.emitDisplayFeatures).toBe(
      'function',
    );

    expect(esmMediaQueries).toHaveProperty('emitEnvironmentFeatures');
    expect(typeof esmMediaQueries.emitEnvironmentFeatures).toBe(
      'function',
    );

    expect(esmMediaQueries).toHaveProperty('emitCustomFeatures');
    expect(typeof esmMediaQueries.emitCustomFeatures).toBe(
      'function',
    );
  });
});
