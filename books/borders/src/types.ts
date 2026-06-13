import type { ColorWrapper } from '@css-bookends/colours';
import type { IMeasurement } from '@css-bookends/css-calipers';
import type { Property } from 'csstype';

/* ---------- value primitives ---------- */

/** A border colour is always whatever the colours `color()` helper returns. */
export type BorderColor = ColorWrapper;
/** A border width: a measurement, or 0 / null for "no width". */
export type BorderWidth = IMeasurement | 0 | null;
/** A border line style (solid, dashed, dotted, ...). */
export type BorderStyle = Property.BorderStyle;

/* ---------- sides / axes ---------- */

export type Side = 'top' | 'right' | 'bottom' | 'left';
export type Axis = 'x' | 'y';

/* ---------- corners / pairs (compass) ---------- */

export type Corner = 'nw' | 'ne' | 'se' | 'sw';
/** n = top corners, s = bottom, e = right, w = left. */
export type Pair = 'n' | 's' | 'e' | 'w';
/** One corner radius: a single measurement, or an elliptical [x, y] pair. */
export type CornerRadius =
  | IMeasurement
  | readonly [
      IMeasurement,
      IMeasurement,
    ];

/* ---------- one edge's border ---------- */

export interface Border {
  width?: BorderWidth;
  style?: BorderStyle;
  color?: BorderColor;
}

/* ---------- the input ---------- */

export type BordersInput = 'none' | 'unset' | BordersSpec;

/**
 * Shorthand (width/style/color/radius) applies to all edges/corners; coordinate
 * keys override. Edges: top/right/bottom/left/x/y (a Border, or `'none'` to omit
 * that edge). Corners: n/s/e/w pairs and nw/ne/se/sw corners (a CornerRadius).
 */
export interface BordersSpec
  extends
    Partial<Record<Side | Axis, Border | 'none'>>,
    Partial<Record<Pair | Corner, CornerRadius>> {
  width?: BorderWidth;
  style?: BorderStyle;
  color?: BorderColor;
  radius?: CornerRadius | 0 | null;
}

/* ---------- factory config ---------- */

export type OutputFormat = 'long' | 'line' | 'short';

/** The book's defaults plus the default output format. */
export interface BordersConfig {
  width: BorderWidth;
  style: BorderStyle;
  color: BorderColor;
  radius: CornerRadius | 0 | null;
  output: OutputFormat;
}

/* ---------- the output contract (plain CSS, one shape per format) ---------- */

/**
 * "Typed tokens in, plain CSS out." The output is always a plain style object.
 * csstype's `Property.*` types are the machine-readable form of the CSS spec, so
 * the contract is the full valid surface (e.g. `Property.BorderTopWidth` already
 * includes `thin/medium/thick`; `Property.BorderTopColor` includes `currentColor`).
 */

/** long: every border longhand, each a valid CSS value. */
export interface BorderLong {
  borderTopWidth?: Property.BorderTopWidth;
  borderRightWidth?: Property.BorderRightWidth;
  borderBottomWidth?: Property.BorderBottomWidth;
  borderLeftWidth?: Property.BorderLeftWidth;
  borderTopStyle?: Property.BorderTopStyle;
  borderRightStyle?: Property.BorderRightStyle;
  borderBottomStyle?: Property.BorderBottomStyle;
  borderLeftStyle?: Property.BorderLeftStyle;
  borderTopColor?: Property.BorderTopColor;
  borderRightColor?: Property.BorderRightColor;
  borderBottomColor?: Property.BorderBottomColor;
  borderLeftColor?: Property.BorderLeftColor;
  borderTopLeftRadius?: Property.BorderTopLeftRadius;
  borderTopRightRadius?: Property.BorderTopRightRadius;
  borderBottomRightRadius?: Property.BorderBottomRightRadius;
  borderBottomLeftRadius?: Property.BorderBottomLeftRadius;
}

/** line: per-edge shorthands + the radius shorthand. */
export interface BorderLine {
  borderTop?: Property.BorderTop;
  borderRight?: Property.BorderRight;
  borderBottom?: Property.BorderBottom;
  borderLeft?: Property.BorderLeft;
  borderRadius?: Property.BorderRadius;
}

/** short: the full shorthand + the radius shorthand. */
export interface BorderShort {
  border?: Property.Border;
  borderRadius?: Property.BorderRadius;
}

/**
 * Anything a borders book emits: a plain CSS style object. The chosen format
 * decides which keys are present; the type is the all-optional superset so a
 * consumer can read or spread any key without narrowing.
 */
export interface BorderOutput
  extends BorderLong, BorderLine, BorderShort {}

/* ---------- the resolved, navigable result ---------- */

/** A resolved edge: leaves are the lexicon values, each with its own `.css()`. */
export interface ResolvedEdge {
  width: IMeasurement;
  style: BorderStyle;
  color: ColorWrapper;
  /** this edge as a style object, in the configured format. */
  css(): BorderOutput;
}

/** A resolved corner radius. */
export interface ResolvedCorner {
  /** the corner radius as a CSS string ('8px' or '8px 4px'). */
  css(): string;
}

/** The result of calling a borders book: render whole, or drill into a coordinate. */
export interface ResolvedBorders
  extends Record<Side, ResolvedEdge>, Record<Corner, ResolvedCorner> {
  /** the whole border as a style object, in the configured output format. */
  css(): BorderOutput;
}

/** A borders book: callable bare (global defaults) or with an input spec. */
export type Borders = (input?: BordersInput) => ResolvedBorders;
