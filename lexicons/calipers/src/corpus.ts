// CORPUS: the LAZY DEFAULTS convenience entry. It re-exports the full default
// set (`m` / `r` / `i` / `f` / `color`, each a factory-at-defaults instance),
// the per-property value helpers, and the factories, so a consumer who just
// wants the defaults never has to bind anything. This is the convenience layer
// ON TOP of the factory, never a replacement: configuration still goes through
// `createCalipers()` / `createColor()` / `createCssValues()`.
//
// Effectively the same surface as the root `.` entry. Unlike `./measurements`,
// this entry is NOT colour-free: importing it pulls in the colour value
// primitive (and its `culori` dependency) by design.
export * from './index';
// `createCalipers` lives on the `./factory` real path and is not re-exported by
// the root; surface it here so the corpus exposes all three factories
// (`createCalipers` / `createColor` / `createCssValues`).
export {
  type CalipersFactoryConfig,
  type CalipersInstance,
  createCalipers,
} from './factory';
