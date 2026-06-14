// The color book. Consume it ONLY through the factory `publishBookColor` (never a
// pre-built instance): bind your own, configured via `output` / `base` / `strictness`.
//
//   const color = publishBookColor({ config: { output: colorFormats.hex } });
//   color('#3366cc').darken(0.2).css();
export * from './color';
