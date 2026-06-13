import { m } from '@css-bookends/css-calipers';
import { describe, expect, it } from 'vitest';

import { margins, paddings } from '../../src/spacing';

describe('spacing.helper', () => {
  it('applies shared axis shortcuts', () => {
    const styles = paddings({
      horizontal: m(4),
    });
    expect(styles).toEqual({
      paddingRight: '4px',
      paddingLeft: '4px',
    });
  });

  it('resolves explicit sides to four-value shorthand', () => {
    const styles = margins({
      vertical: m(10),
      horizontal: m(6),
      left: m(20),
    });
    expect(styles).toEqual({
      marginTop: '10px',
      marginRight: '6px',
      marginBottom: '10px',
      marginLeft: '20px',
    });
  });

  it('throws on invalid input types', () => {
    expect(() =>
      paddings('8px' as unknown as Parameters<typeof paddings>[0]),
    ).toThrow(/spacing value or spacing intent object/);
  });

  it('derives three-value shorthand when vertical differs', () => {
    const styles = margins({
      top: m(16),
      bottom: m(8),
      horizontal: m(4),
    });
    expect(styles).toEqual({
      marginTop: '16px',
      marginRight: '4px',
      marginBottom: '8px',
      marginLeft: '4px',
    });
  });

  it('builds four-value shorthand when all sides differ', () => {
    const styles = paddings({
      top: m(1),
      right: m(2),
      bottom: m(3),
      left: m(4),
    });
    expect(styles).toEqual({
      paddingTop: '1px',
      paddingRight: '2px',
      paddingBottom: '3px',
      paddingLeft: '4px',
    });
  });

  it('mixes keywords with measurements per side', () => {
    const styles = paddings({
      vertical: 'auto',
      horizontal: m(12),
      left: 'inherit',
    });
    expect(styles).toEqual({
      paddingTop: 'auto',
      paddingRight: '12px',
      paddingBottom: 'auto',
      paddingLeft: 'inherit',
    });
  });

  it('accepts a single measurement as shorthand for all sides', () => {
    const styles = margins(m(8));
    expect(styles).toEqual({
      marginTop: '8px',
      marginRight: '8px',
      marginBottom: '8px',
      marginLeft: '8px',
    });
  });

  it('accepts a single spacing keyword as shorthand for all sides', () => {
    const styles = paddings('auto');
    expect(styles).toEqual({
      paddingTop: 'auto',
      paddingRight: 'auto',
      paddingBottom: 'auto',
      paddingLeft: 'auto',
    });
  });

  it('returns no spacing when no input is provided', () => {
    expect(paddings()).toEqual({});
    expect(margins()).toEqual({});
  });

  it('accepts an axis-only intent without all', () => {
    const styles = margins({
      vertical: m(8),
      horizontal: m(0),
    });
    expect(styles).toEqual({
      marginTop: '8px',
      marginRight: '0px',
      marginBottom: '8px',
      marginLeft: '0px',
    });
  });

  it('supports horizontal-only spacing intent', () => {
    const styles = margins({
      horizontal: m(5),
    });
    expect(styles).toEqual({
      marginRight: '5px',
      marginLeft: '5px',
    });
  });

  it('supports single-side spacing intent', () => {
    const styles = paddings({
      left: m(10),
    });
    expect(styles).toEqual({
      paddingLeft: '10px',
    });
  });

  it('supports multiple spacing keywords', () => {
    const styles = paddings('inherit');
    expect(styles).toEqual({
      paddingTop: 'inherit',
      paddingRight: 'inherit',
      paddingBottom: 'inherit',
      paddingLeft: 'inherit',
    });
  });
});
