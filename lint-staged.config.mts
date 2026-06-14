import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

// TEMP: packages excluded from ESLint + tsc in the hook while they are
// rewritten against the new bookpress publishBook API. Staged files in these
// packages are still Prettier-formatted. Empty this set to restore (and remove
// the matching `--filter='!...'` flags from the root package.json scripts).
const TEMP_EXCLUDED = new Set([
  '@css-bookends/color',
  '@css-bookends/borders',
]);

// Shell-safe quoting for file paths passed on a command line.
const q = (file: string): string => JSON.stringify(file);

// The package that owns a file = nearest ancestor dir with an eslint.config.js.
// Files outside any package (root scripts, packages/eslint-config/index.js, this
// config) return null and are formatted by Prettier only.
function owningPackage(file: string): string | null {
  let dir = path.dirname(path.resolve(file));
  while (dir.length >= ROOT.length && dir.startsWith(ROOT)) {
    if (existsSync(path.join(dir, 'eslint.config.js'))) return dir;
    if (dir === ROOT) break;
    dir = path.dirname(dir);
  }
  return null;
}

function packageName(dir: string): string {
  return JSON.parse(
    readFileSync(path.join(dir, 'package.json'), 'utf8'),
  ).name;
}

export default {
  // Code: per owning package (flat config does not cascade and type-aware
  // tooling needs the package as cwd, so route through `pnpm --filter`) run
  // ESLint --fix then a whole-project `tsc --noEmit`; finally let Prettier
  // have the last formatting pass over every staged file.
  '*.{ts,tsx,mts,cts,js,jsx,cjs,mjs}': (
    files: string[],
  ): string[] => {
    const byPackage = new Map<string, string[]>();
    for (const file of files) {
      const dir = owningPackage(file);
      if (!dir) continue;
      if (!byPackage.has(dir)) byPackage.set(dir, []);
      byPackage.get(dir)!.push(file);
    }

    const commands: string[] = [];
    for (const [
      dir,
      group,
    ] of byPackage) {
      const name = packageName(dir);
      if (TEMP_EXCLUDED.has(name)) continue;
      commands.push(
        `pnpm --filter ${name} exec eslint --fix ${group.map(q).join(' ')}`,
      );
      // tsc type-checks the whole project (it cannot reliably check a lone
      // file under project references), so run it once per affected package.
      if (existsSync(path.join(dir, 'tsconfig.json'))) {
        commands.push(
          `pnpm --filter ${name} exec tsc -p tsconfig.json --noEmit`,
        );
      }
    }
    commands.push(`prettier --write ${files.map(q).join(' ')}`);
    return commands;
  },

  // Non-code: Prettier only. `.prettierignore` is respected, so markdown and
  // other ignored paths are skipped.
  '*.{json,jsonc,yaml,yml,css,html}': (files: string[]): string[] => [
    `prettier --write ${files.map(q).join(' ')}`,
  ],
};
