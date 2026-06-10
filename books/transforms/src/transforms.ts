import type { IMeasurement } from '@css-bookends/css-calipers';

import type * as CSS_TYPES from 'csstype';

type LengthValue = IMeasurement | null | undefined;
type AngleValue = IMeasurement | null | undefined;
type ScaleValue = number | null | undefined;

export type TranslateIntent = {
  xy?: LengthValue;
  x?: LengthValue;
  y?: LengthValue;
  z?: LengthValue;
};

export type RotateIntent = {
  value?: AngleValue;
  x?: AngleValue;
  y?: AngleValue;
  z?: AngleValue;
};

export type ScaleIntent = {
  xy?: ScaleValue;
  value?: ScaleValue;
  x?: ScaleValue;
  y?: ScaleValue;
  z?: ScaleValue;
};

export type SkewIntent = {
  x?: AngleValue;
  y?: AngleValue;
};

export type TransformIntent = {
  translate?: TranslateIntent;
  rotate?: RotateIntent;
  scale?: ScaleIntent;
  skew?: SkewIntent;
  perspective?: LengthValue;
  custom?: string | Array<string | undefined | null>;
};

const toCssLength = (value: LengthValue): string | undefined =>
  value ? value.css() : undefined;

const toCssAngle = (value: AngleValue): string | undefined =>
  value ? value.css() : undefined;

const toCssScale = (value: ScaleValue): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (Number.isFinite(value)) return value.toString();
  return undefined;
};

const appendTranslate = (
  parts: string[],
  intent?: TranslateIntent,
) => {
  if (!intent) return;
  let x = toCssLength(intent.xy);
  let y = toCssLength(intent.xy);
  const z = toCssLength(intent.z);

  if (intent.y) {
    y = toCssLength(intent.y);
  }
  if (intent.x) {
    x = toCssLength(intent.x);
  }

  if (z) {
    parts.push(`translate3d(${x ?? '0'}, ${y ?? '0'}, ${z})`);
    return;
  }

  if (x && y) {
    parts.push(`translate(${x}, ${y})`);
    return;
  }

  if (x) {
    parts.push(`translateX(${x})`);
  }

  if (y) {
    parts.push(`translateY(${y})`);
  }
};

const appendRotate = (parts: string[], intent?: RotateIntent) => {
  if (!intent) return;
  const { value, x, y, z } = intent;
  const base = toCssAngle(value);
  if (base) parts.push(`rotate(${base})`);
  const rotX = toCssAngle(x);
  if (rotX) parts.push(`rotateX(${rotX})`);
  const rotY = toCssAngle(y);
  if (rotY) parts.push(`rotateY(${rotY})`);
  const rotZ = toCssAngle(z);
  if (rotZ) parts.push(`rotateZ(${rotZ})`);
};

const appendScale = (parts: string[], intent?: ScaleIntent) => {
  if (!intent) return;
  const { value, x, y, z } = intent;
  const base = toCssScale(value);
  if (base) parts.push(`scale(${base})`);
  let sx = toCssScale(intent.xy);
  let sy = toCssScale(intent.xy);
  if (x !== null && x !== undefined) {
    sx = toCssScale(x);
  }
  if (y !== null && y !== undefined) {
    sy = toCssScale(y);
  }
  if (sx) parts.push(`scaleX(${sx})`);
  if (sy) parts.push(`scaleY(${sy})`);
  const sz = toCssScale(z);
  if (sz) parts.push(`scaleZ(${sz})`);
  if (sx && sy && sz) {
    parts.push(`scale3d(${sx}, ${sy}, ${sz})`);
  }
};

const appendSkew = (parts: string[], intent?: SkewIntent) => {
  if (!intent) return;
  const skewX = toCssAngle(intent.x);
  if (skewX) parts.push(`skewX(${skewX})`);
  const skewY = toCssAngle(intent.y);
  if (skewY) parts.push(`skewY(${skewY})`);
};

const appendPerspective = (parts: string[], value?: LengthValue) => {
  const css = toCssLength(value);
  if (css) parts.push(`perspective(${css})`);
};

const appendCustom = (
  parts: string[],
  custom?: string | Array<string | undefined | null>,
) => {
  if (!custom) return;
  const list = Array.isArray(custom)
    ? custom
    : [
        custom,
      ];
  list
    .filter(
      (entry): entry is string =>
        typeof entry === 'string' && entry.trim().length > 0,
    )
    .forEach((entry) => parts.push(entry));
};

const buildTransformParts = (
  intents: Array<TransformIntent | null | undefined>,
): string[] => {
  const parts: string[] = [];
  intents.forEach((intent) => {
    if (!intent) return;
    appendTranslate(parts, intent.translate);
    appendRotate(parts, intent.rotate);
    appendScale(parts, intent.scale);
    appendSkew(parts, intent.skew);
    appendPerspective(parts, intent.perspective);
    appendCustom(parts, intent.custom);
  });
  return parts.filter((part) => part.trim().length > 0);
};

export const transformValue = (
  ...intents: Array<TransformIntent | null | undefined>
): CSS_TYPES.Property.Transform | undefined => {
  const parts = buildTransformParts(intents);
  return parts.length ? parts.join(' ') : undefined;
};

export const transformStyle = (
  ...intents: Array<TransformIntent | null | undefined>
) => {
  const transform = transformValue(...intents);
  return transform ? { transform } : {};
};

type TransformComposer = {
  (...intents: Array<TransformIntent | null | undefined>): {
    transform?: CSS_TYPES.Property.Transform;
  };
  value: typeof transformValue;
  style: typeof transformStyle;
};

const transforms = ((...intents) =>
  transformStyle(...intents)) as TransformComposer;

transforms.value = transformValue;
transforms.style = transformStyle;

export default transforms;
