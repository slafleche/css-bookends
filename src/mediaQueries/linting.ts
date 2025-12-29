import type {
  MediaQueryBuilderHelpers,
  MediaQueryLintingMode,
} from './helpers';

export type MediaQueryLintCheck<TConfig> = (config: TConfig) => void;

export const runMediaQueryLint = <TConfig>(
  config: TConfig,
  helpers: MediaQueryBuilderHelpers,
  check?: MediaQueryLintCheck<TConfig>,
  message = 'Media query lint failed',
): boolean => {
  if (!check) return true;
  const mode: MediaQueryLintingMode =
    helpers.config.errorHandling?.lintingMode ?? 'allow';
  if (mode === 'allow') return true;
  if (mode === 'log') {
    try {
      check(config);
      return true;
    } catch {
      console.warn(message);
      return true;
    }
  }

  check(config);
  return true;
};
