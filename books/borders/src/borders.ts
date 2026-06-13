import { bookPress, type Press } from '@css-bookends/bookpress';
import { color, type ColorWrapper } from '@css-bookends/colours';
import { type IMeasurement, m } from '@css-bookends/css-calipers';

import type {
  Border,
  BorderOutput,
  Borders,
  BordersConfig,
  BordersInput,
  BordersSpec,
  BorderStyle,
  BorderWidth,
  Corner,
  CornerRadius,
  ResolvedBorders,
  ResolvedCorner,
  ResolvedEdge,
  Side,
} from './types';

/* The book's built-in defaults. A project overrides these via makeBorders(config). */
export const defaultConfig: BordersConfig = {
  width: m(1),
  style: 'solid',
  color: color('black'),
  radius: null, // no default rounding
  output: 'long',
};

/* ---------- internal store (page 2) ---------- */

interface EdgeData {
  width: IMeasurement;
  style: BorderStyle;
  color: ColorWrapper;
  omitted: boolean;
}

interface Store {
  edges: Record<Side, EdgeData>;
  corners: Record<Corner, CornerRadius | undefined>;
}

const SIDES: Side[] = [
  'top',
  'right',
  'bottom',
  'left',
];
const CORNERS: Corner[] = [
  'nw',
  'ne',
  'se',
  'sw',
];

const CORNER_PROP: Record<Corner, string> = {
  nw: 'borderTopLeftRadius',
  ne: 'borderTopRightRadius',
  se: 'borderBottomRightRadius',
  sw: 'borderBottomLeftRadius',
};

const cap = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);
const toWidth = (w: BorderWidth): IMeasurement =>
  w == null || w === 0 ? m(0) : w;
const toCorner = (
  r: CornerRadius | 0 | null | undefined,
): CornerRadius | undefined =>
  r == null ? undefined : r === 0 ? m(0) : r;

const renderCorner = (value: CornerRadius | undefined): string => {
  if (value === undefined) return '0';
  if (Array.isArray(value)) {
    const [
      x,
      y,
    ] = value as readonly [
      IMeasurement,
      IMeasurement,
    ];
    return `${x.css()} ${y.css()}`;
  }
  return (value as IMeasurement).css();
};

/* ---------- input (page 1): raw -> store ---------- */

function applyEdge(
  edges: Record<Side, EdgeData>,
  sides: Side[],
  val: Border | 'none' | undefined,
): void {
  if (val === undefined) return;
  if (val === 'none') {
    sides.forEach((s) => {
      edges[s].omitted = true;
    });
    return;
  }
  sides.forEach((s) => {
    if (val.width !== undefined) edges[s].width = toWidth(val.width);
    if (val.style !== undefined) edges[s].style = val.style;
    if (val.color !== undefined) edges[s].color = val.color;
    edges[s].omitted = false;
  });
}

function applyCorner(
  corners: Record<Corner, CornerRadius | undefined>,
  targets: Corner[],
  val: CornerRadius | undefined,
): void {
  if (val === undefined) return;
  targets.forEach((c) => {
    corners[c] = val;
  });
}

function parse(
  raw: BordersInput | undefined,
  cfg: BordersConfig,
): Store {
  const baseEdge = (): EdgeData => ({
    width: toWidth(cfg.width),
    style: cfg.style,
    color: cfg.color,
    omitted: false,
  });
  const edges: Record<Side, EdgeData> = {
    top: baseEdge(),
    right: baseEdge(),
    bottom: baseEdge(),
    left: baseEdge(),
  };
  const corners: Record<Corner, CornerRadius | undefined> = {
    nw: toCorner(cfg.radius),
    ne: toCorner(cfg.radius),
    se: toCorner(cfg.radius),
    sw: toCorner(cfg.radius),
  };

  if (raw === 'none') {
    SIDES.forEach((s) => {
      edges[s].omitted = true;
    });
    CORNERS.forEach((c) => {
      corners[c] = undefined;
    });
    return { edges, corners };
  }
  if (raw === undefined || raw === 'unset') {
    return { edges, corners };
  }

  const spec: BordersSpec = raw;

  // shorthand (all edges / all corners)
  if (spec.width !== undefined)
    SIDES.forEach((s) => (edges[s].width = toWidth(spec.width!)));
  if (spec.style !== undefined)
    SIDES.forEach((s) => (edges[s].style = spec.style!));
  if (spec.color !== undefined)
    SIDES.forEach((s) => (edges[s].color = spec.color!));
  if (spec.radius !== undefined)
    CORNERS.forEach((c) => (corners[c] = toCorner(spec.radius)));

  // edge overrides: axis (x = left+right, y = top+bottom), then concrete sides
  applyEdge(
    edges,
    [
      'left',
      'right',
    ],
    spec.x,
  );
  applyEdge(
    edges,
    [
      'top',
      'bottom',
    ],
    spec.y,
  );
  SIDES.forEach((s) =>
    applyEdge(
      edges,
      [
        s,
      ],
      spec[s],
    ),
  );

  // corner overrides: pairs, then concrete corners (precedence all < pair < corner)
  applyCorner(
    corners,
    [
      'nw',
      'ne',
    ],
    spec.n,
  );
  applyCorner(
    corners,
    [
      'se',
      'sw',
    ],
    spec.s,
  );
  applyCorner(
    corners,
    [
      'ne',
      'se',
    ],
    spec.e,
  );
  applyCorner(
    corners,
    [
      'nw',
      'sw',
    ],
    spec.w,
  );
  CORNERS.forEach((c) =>
    applyCorner(
      corners,
      [
        c,
      ],
      spec[c],
    ),
  );

  return { edges, corners };
}

/* ---------- output (page 3): store -> navigable ResolvedBorders ---------- */

function build(store: Store): ResolvedBorders {
  const edgeCss = (side: Side): BorderOutput => {
    const e = store.edges[side];
    if (e.omitted) return {};
    const C = cap(side);
    return {
      [`border${C}Width`]: e.width.css(),
      [`border${C}Style`]: e.style,
      [`border${C}Color`]: e.color.css(),
    };
  };

  const fullCss = (): BorderOutput => {
    const out: Record<string, string> = {};
    SIDES.forEach((s) => Object.assign(out, edgeCss(s)));
    CORNERS.forEach((c) => {
      const v = store.corners[c];
      if (v !== undefined) out[CORNER_PROP[c]] = renderCorner(v);
    });
    return out;
  };

  const edgeNode = (side: Side): ResolvedEdge => {
    const e = store.edges[side];
    return {
      width: e.width,
      style: e.style,
      color: e.color,
      css: () => edgeCss(side),
    };
  };
  const cornerNode = (c: Corner): ResolvedCorner => ({
    css: () => renderCorner(store.corners[c]),
  });

  return {
    top: edgeNode('top'),
    right: edgeNode('right'),
    bottom: edgeNode('bottom'),
    left: edgeNode('left'),
    nw: cornerNode('nw'),
    ne: cornerNode('ne'),
    se: cornerNode('se'),
    sw: cornerNode('sw'),
    css: fullCss,
  };
}

/* ---------- the press + the factory ---------- */

const bordersPress: Press<
  BordersInput,
  Store,
  ResolvedBorders,
  BordersConfig
> = {
  defaults: defaultConfig,
  input: (raw, cfg) => parse(raw, cfg),
  storage: (store) => store,
  outputs: { default: (store) => build(store) },
  default: 'default',
};

/**
 * makeBorders: the borders factory. Give it defaults + output format, get a
 * borders book. A bare call renders the global defaults.
 */
export function makeBorders(
  config: Partial<BordersConfig> = {},
): Borders {
  return bookPress(bordersPress)({ config }) as Borders;
}
