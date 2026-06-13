import { describe, expect, it } from 'vitest';

/*
 * The SPECIAL (symbolic) color words: keywords with no fixed value. Separate suite
 * from the make x emit matrix because they behave differently - they pass through.
 *
 * Real failing placeholders (red on purpose), never `it.todo`. Implement, then
 * replace `pending()` with the real assertion.
 */
const pending = (): void => {
  expect(false).toBe(true); // pending: implement this case
};

const SYMBOLIC = [
  'currentColor',
  // system colors (current, CSS Color 4)
  'Canvas',
  'CanvasText',
  'LinkText',
  'VisitedText',
  'ActiveText',
  'ButtonFace',
  'ButtonText',
  'ButtonBorder',
  'Field',
  'FieldText',
  'Highlight',
  'HighlightText',
  'SelectedItem',
  'SelectedItemText',
  'Mark',
  'MarkText',
  'GrayText',
  'AccentColor',
  'AccentColorText',
  // system colors (deprecated, Appendix A - still accepted)
  'ActiveBorder',
  'ActiveCaption',
  'AppWorkspace',
  'Background',
  'ButtonHighlight',
  'ButtonShadow',
  'CaptionText',
  'InactiveBorder',
  'InactiveCaption',
  'InactiveCaptionText',
  'InfoBackground',
  'InfoText',
  'Menu',
  'MenuText',
  'Scrollbar',
  'ThreeDDarkShadow',
  'ThreeDFace',
  'ThreeDHighlight',
  'ThreeDLightShadow',
  'ThreeDShadow',
  'Window',
  'WindowFrame',
  'WindowText',
  // CSS-wide cascade keywords
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
];

// Passthrough: a symbolic color emits its own keyword no matter which output
// format is requested. e.g. `Highlight` -> 'Highlight' for css/hex/oklch/anything.
describe('color — symbolic keywords pass through for any format', () => {
  for (const keyword of SYMBOLIC) {
    it(`${keyword} emits "${keyword}" regardless of format`, pending);
  }
});

// TODO: evaluate which (if any) modifications are valid on symbolic colors. They
// have no fixed value, so today every modifier throws - but some keywords might
// reasonably support specific ops later. Revisit per keyword; until then these
// assert the current "rejected" behavior.
describe('color — symbolic keywords reject modification (TODO: evaluate per keyword)', () => {
  for (const keyword of SYMBOLIC) {
    it(`${keyword} modification is rejected`, pending);
  }
});
