import { describe, expect, it } from 'vitest';

const cjsMediaQueries = await import(
  '../../../dist/cjs/mediaQueries/index.js'
);

describe('mediaQueries API surface (CJS)', () => {
  it('exposes expected media queries helpers', () => {
    expect(cjsMediaQueries).toHaveProperty('buildMediaQueryString');
    expect(typeof cjsMediaQueries.buildMediaQueryString).toBe('function');

    expect(cjsMediaQueries).toHaveProperty('makeMediaQueryStyle');
    expect(typeof cjsMediaQueries.makeMediaQueryStyle).toBe('function');

    expect(cjsMediaQueries).toHaveProperty('createMediaQueryBuilder');
    expect(typeof cjsMediaQueries.createMediaQueryBuilder).toBe('function');

    expect(cjsMediaQueries).toHaveProperty('buildMediaQueryFromFeatures');
    expect(typeof cjsMediaQueries.buildMediaQueryFromFeatures).toBe('function');

    expect(cjsMediaQueries).toHaveProperty('buildMediaQueryStringFromParts');
    expect(typeof cjsMediaQueries.buildMediaQueryStringFromParts).toBe('function');

    expect(cjsMediaQueries).toHaveProperty('createMediaQueryFeatureEmitter');
    expect(typeof cjsMediaQueries.createMediaQueryFeatureEmitter).toBe('function');

    expect(cjsMediaQueries).toHaveProperty(
      'createMediaQueryFeatureEmitterWithTracking',
    );
    expect(typeof cjsMediaQueries.createMediaQueryFeatureEmitterWithTracking).toBe(
      'function',
    );

    expect(cjsMediaQueries).toHaveProperty('mediaQueryFactory');
    expect(typeof cjsMediaQueries.mediaQueryFactory).toBe('function');

    expect(cjsMediaQueries).toHaveProperty('defineMediaQueryModules');
    expect(typeof cjsMediaQueries.defineMediaQueryModules).toBe('function');

    expect(cjsMediaQueries).toHaveProperty('mediaQueryOutputVanillaExtract');
    expect(typeof cjsMediaQueries.mediaQueryOutputVanillaExtract).toBe(
      'function',
    );
  });

  it('exposes media query module emitters', () => {
    expect(cjsMediaQueries).toHaveProperty('emitCoreFeatures');
    expect(typeof cjsMediaQueries.emitCoreFeatures).toBe('function');

    expect(cjsMediaQueries).toHaveProperty('emitDimensionsFeatures');
    expect(typeof cjsMediaQueries.emitDimensionsFeatures).toBe('function');

    expect(cjsMediaQueries).toHaveProperty('emitResolutionFeatures');
    expect(typeof cjsMediaQueries.emitResolutionFeatures).toBe('function');

    expect(cjsMediaQueries).toHaveProperty('emitInteractionFeatures');
    expect(typeof cjsMediaQueries.emitInteractionFeatures).toBe('function');

    expect(cjsMediaQueries).toHaveProperty('emitPreferencesFeatures');
    expect(typeof cjsMediaQueries.emitPreferencesFeatures).toBe('function');

    expect(cjsMediaQueries).toHaveProperty('emitDisplayFeatures');
    expect(typeof cjsMediaQueries.emitDisplayFeatures).toBe('function');

    expect(cjsMediaQueries).toHaveProperty('emitEnvironmentFeatures');
    expect(typeof cjsMediaQueries.emitEnvironmentFeatures).toBe('function');

    expect(cjsMediaQueries).toHaveProperty('emitCustomFeatures');
    expect(typeof cjsMediaQueries.emitCustomFeatures).toBe('function');
  });
});
