import type {
  AnchorSize,
  Side,
  SideAccessor,
  SpacingConfig,
  SpacingProperty,
  SpacingResult,
  SpacingSlot,
  SpacingStore,
  SpacingStyle,
} from './types';

/* ============================================================================
 * OUTPUT step (shared): render a canonical `SpacingStore` of tagged slots into the book's
 * CSS - a spreadable style object or a declaration string, in longhand or collapsed shorthand.
 * Shared by padding + margin (only the property name + value domain differ), so it lives in
 * the lexicon and each book wires it via its manuscript.
 *
 * Output TRUSTS the validated store: it only renders and compares/selects existing slots, it
 * does no measurement arithmetic, so no value-domain brand (e.g. NonNegativeMeasurement) needs
 * re-checking here. A future edit that introduces arithmetic on slot values MUST re-harden.
 * ==========================================================================*/

/** The output config defaults: per-side longhands, as a spreadable style object. */
export const defaultSpacingConfig: SpacingConfig = {
  emit: 'longhand',
  format: 'object',
};

const SIDES: readonly Side[] = [
  'top',
  'right',
  'bottom',
  'left',
];

const cap = (s: Side): Capitalize<Side> =>
  (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<Side>;

/**
 * Render a modeled `anchor-size()` value:
 *   anchor-size( [ <dashed-ident> || <anchor-size> ]? , <length-percentage>? )
 */
export const anchorSizeToCss = (a: AnchorSize): string => {
  const head = [
    a.anchor,
    a.size,
  ]
    .filter(Boolean)
    .join(' ');
  const fallback = a.fallback ? `, ${a.fallback.css()}` : '';
  return `anchor-size(${head}${fallback})`;
};

/**
 * One canonical slot -> its bare CSS string. Exhaustive over {@link SpacingSlot}'s `kind`:
 * adding a slot kind makes the `never` fallback fail to compile. A `symbolic` keyword (the
 * special words `auto` / CSS-wide) is emitted verbatim, mirroring the colour book's render.
 */
export const slotToCss = (slot: SpacingSlot): string => {
  switch (slot.kind) {
    case 'length':
      return slot.value === 0 ? '0px' : slot.value.css();
    case 'symbolic':
      return slot.keyword;
    case 'anchorSize':
      return anchorSizeToCss(slot);
    default: {
      const _exhaustive: never = slot;
      throw new Error(
        `spacing: unrenderable slot ${String(_exhaustive)}`,
      );
    }
  }
};

/**
 * Collapse four rendered side values into the canonical 1-4 value shorthand, comparing
 * rendered strings: `a a a a` -> `a`; `a b a b` -> `a b`; `a b c b` -> `a b c`; else 4.
 */
const collapseShorthand = (
  top: string,
  right: string,
  bottom: string,
  left: string,
): string => {
  const parts = [
    top,
    right,
    bottom,
    left,
  ];
  if (left === right) {
    parts.pop(); // drop left -> [t, r, b]
    if (bottom === top) {
      parts.pop(); // drop bottom -> [t, r]
      if (right === top) {
        parts.pop(); // drop right -> [t]
      }
    }
  }
  return parts.join(' ');
};

/**
 * Build the book's {@link SpacingResult} from a tagged store, the output config, and the
 * property name (`'margin'` / `'padding'`), which keys both the object form (`marginTop`) and
 * the string form (`margin-top`) and the shorthand (`margin`).
 */
export const makeSpacingResult = <P extends SpacingProperty>(
  store: SpacingStore,
  cfg: SpacingConfig,
  property: P,
): SpacingResult<P> => {
  const sideKey = (side: Side): string => `${property}${cap(side)}`;

  // a present side's bare value, or undefined when the side is absent.
  const sideCss = (side: Side): string | undefined => {
    const slot = store[side];
    return slot === undefined ? undefined : slotToCss(slot);
  };

  // an axis's shared bare value: only when both sides are present AND render equal.
  const axisCss = (a: Side, b: Side): string | undefined => {
    const va = sideCss(a);
    const vb = sideCss(b);
    return va !== undefined && vb !== undefined && va === vb
      ? va
      : undefined;
  };

  const isComplete = (): boolean =>
    SIDES.every((side) => store[side] !== undefined);

  const longhandObject = (): SpacingStyle<P> => {
    const out: Record<string, string> = {};
    for (const side of SIDES) {
      const value = sideCss(side);
      if (value !== undefined) out[sideKey(side)] = value;
    }
    return out as SpacingStyle<P>;
  };

  const longhandString = (): string => {
    const decls: string[] = [];
    for (const side of SIDES) {
      const value = sideCss(side);
      if (value !== undefined) {
        decls.push(`${property}-${side}: ${value}`);
      }
    }
    return decls.join('; ');
  };

  // caller guarantees the store is complete (all four sides present).
  const shorthandValue = (): string =>
    collapseShorthand(
      sideCss('top') as string,
      sideCss('right') as string,
      sideCss('bottom') as string,
      sideCss('left') as string,
    );

  const shorthandObject = (): SpacingStyle<P> =>
    ({ [property]: shorthandValue() }) as SpacingStyle<P>;

  const shorthandString = (): string =>
    `${property}: ${shorthandValue()}`;

  const longhand = (): SpacingStyle<P> | string =>
    cfg.format === 'object' ? longhandObject() : longhandString();

  const shorthand = (): SpacingStyle<P> | string => {
    if (!isComplete()) {
      throw new Error(
        `spacing: ${property} shorthand needs all four sides (the store is partial)`,
      );
    }
    return cfg.format === 'object'
      ? shorthandObject()
      : shorthandString();
  };

  // configured emit x format. shorthand on a partial store falls back to longhand (lossless),
  // so `.css()` always renders; the explicit `.shorthand()` is the strict form that throws.
  const css = (): SpacingStyle<P> | string =>
    cfg.emit === 'shorthand' && isComplete()
      ? shorthand()
      : longhand();

  const sideAccessor = (side: Side): SideAccessor<P> => {
    const accessor = ((): SpacingStyle<P> | string | undefined => {
      const value = sideCss(side);
      if (value === undefined) return undefined;
      return cfg.format === 'object'
        ? ({ [sideKey(side)]: value } as SpacingStyle<P>)
        : `${property}-${side}: ${value}`;
    }) as SideAccessor<P>;
    accessor.css = (): string | undefined => sideCss(side);
    return accessor;
  };

  const axisAccessor = (a: Side, b: Side): SideAccessor<P> => {
    const accessor = ((): SpacingStyle<P> | string | undefined => {
      const va = sideCss(a);
      const vb = sideCss(b);
      if (va === undefined && vb === undefined) return undefined;
      if (cfg.format === 'object') {
        const out: Record<string, string> = {};
        if (va !== undefined) out[sideKey(a)] = va;
        if (vb !== undefined) out[sideKey(b)] = vb;
        return out as SpacingStyle<P>;
      }
      const decls: string[] = [];
      if (va !== undefined) decls.push(`${property}-${a}: ${va}`);
      if (vb !== undefined) decls.push(`${property}-${b}: ${vb}`);
      return decls.join('; ');
    }) as SideAccessor<P>;
    accessor.css = (): string | undefined => axisCss(a, b);
    return accessor;
  };

  return {
    css,
    longhand,
    shorthand,
    top: sideAccessor('top'),
    right: sideAccessor('right'),
    bottom: sideAccessor('bottom'),
    left: sideAccessor('left'),
    x: axisAccessor('left', 'right'),
    y: axisAccessor('top', 'bottom'),
  };
};
