import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import readline from 'node:readline';

const DIST_TAG = 'latest';

const runStep = (label, command, args, options = {}) => {
  console.log(`\n> ${label}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
  if (result.status !== 0) {
    console.error(`\n✖ ${label} failed (exit code ${result.status ?? 1})`);
    process.exit(result.status ?? 1);
  }
};

const getPublishedVersions = (packageName) => {
  try {
    const output = execSync(
      `npm view ${packageName} versions --json`,
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    const parsed = JSON.parse(output);
    if (Array.isArray(parsed)) {
      return parsed.map((v) => String(v));
    }
    return parsed ? [String(parsed)] : [];
  } catch {
    console.warn(
      '\n! Warning: unable to read published versions from npm registry. Skipping remote version checks.',
    );
    return null;
  }
};

const semverParts = (version) =>
  String(version)
    .split('-')[0]
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);

const compareSemver = (a, b) => {
  const [aMajor, aMinor, aPatch] = semverParts(a);
  const [bMajor, bMinor, bPatch] = semverParts(b);

  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
};

const bumpSemver = (current, bumpType) => {
  const [major, minor, patch] = semverParts(current);
  if (bumpType === 'patch') return `${major}.${minor}.${patch + 1}`;
  if (bumpType === 'minor') return `${major}.${minor + 1}.0`;
  if (bumpType === 'major') return `${major + 1}.0.0`;
  return current;
};

const getCurrentBranch = () => {
  try {
    const output = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
    });
    return output.trim();
  } catch {
    return null;
  }
};

const hasUncommittedChanges = () => {
  try {
    const output = execSync('git status --porcelain', {
      encoding: 'utf8',
    });
    return output.trim().length > 0;
  } catch {
    return false;
  }
};

const prompt = (question, defaultValue = '') =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const suffix = defaultValue ? ` [${defaultValue}]` : '';
    rl.question(`${question}${suffix} `, (answer) => {
      rl.close();
      const normalized = answer.trim();
      resolve(normalized || defaultValue);
    });
  });

const ensureDistOutputsExist = () => {
  const cjsEntry = 'dist/cjs/index.js';
  const esmEntry = 'dist/esm/index.js';
  if (!existsSync(cjsEntry) || !existsSync(esmEntry)) {
    console.error(
      '\n✖ Build outputs not found. Expected:\n' +
        `  - ${cjsEntry}\n` +
        `  - ${esmEntry}`,
    );
    process.exit(1);
  }
};

const readPackageVersion = () => {
  const pkgPath = new URL('../package.json', import.meta.url);
  const raw = readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(raw);
  return pkg.version;
};

const main = async () => {
  const isDryRun = process.argv.slice(2).includes('--dry-run');

  const branch = getCurrentBranch();
  if (branch !== 'main') {
    console.error(
      `✖ Releases must be initiated from the "main" branch (current: "${branch ?? 'unknown'}").`,
    );
    process.exit(1);
  }

  if (hasUncommittedChanges()) {
    console.warn(
      '\n! Warning: working tree has uncommitted or staged changes.\n' +
        '  Release will proceed using the current state; stash or commit if this is not intended.',
    );
  }

  runStep('Running unit tests', 'npm', ['test']);
  runStep('Building artifacts', 'npm', ['run', 'build']);
  ensureDistOutputsExist();

  const currentVersion = readPackageVersion();

  let bumpType = '';
  while (!bumpType) {
    const choice = await prompt(
      'Select version bump: (p)atch / (m)inor / (M)ajor',
      'p',
    );
    const normalized = choice.toLowerCase();
    if (normalized === 'p' || normalized === 'patch') {
      bumpType = 'patch';
    } else if (normalized === 'm' || normalized === 'minor') {
      bumpType = 'minor';
    } else if (normalized === 'major') {
      bumpType = 'major';
    } else {
      console.log(
        'Unrecognized choice. Please enter "p", "m", "major", or press Enter for patch.',
      );
    }
  }

  const simulatedNewVersion = bumpSemver(currentVersion, bumpType);

  if (isDryRun) {
    console.log(
      `\nDry run: would bump version ${currentVersion} -> ${simulatedNewVersion} (${bumpType}) and publish css-calipers@${simulatedNewVersion} to npm with dist-tag "${DIST_TAG}".`,
    );
    process.exit(0);
  }

  runStep(`Bumping version (${bumpType})`, 'npm', ['version', bumpType]);

  const newVersion = readPackageVersion();
  const publishedVersions = getPublishedVersions('css-calipers');

  if (publishedVersions && publishedVersions.length > 0) {
    if (publishedVersions.includes(newVersion)) {
      console.error(
        `\n✖ Version ${newVersion} is already published on npm. Aborting release.`,
      );
      process.exit(1);
    }

    const latestPublished = publishedVersions.reduce((max, version) =>
      compareSemver(version, max) > 0 ? version : max,
    );

    if (compareSemver(newVersion, latestPublished) <= 0) {
      console.error(
        `\n✖ New version ${newVersion} is not greater than the latest published version ${latestPublished}. Aborting release.`,
      );
      process.exit(1);
    }
  }

  const confirm = await prompt(
    `Publish version ${newVersion} to npm? (y/N)`,
    'n',
  );
  if (!/^y(es)?$/i.test(confirm)) {
    console.log(
      `Release flow completed up to version bump. Skipping npm publish for ${newVersion}.`,
    );
    process.exit(0);
  }

  runStep(
    `Publishing ${newVersion} to npm (tag: ${DIST_TAG})`,
    'npm',
    ['publish'],
    {
    env: { ...process.env, CSS_CALIPERS_RELEASE: '1' },
    },
  );
  console.log(`\n✓ Published css-calipers@${newVersion} to npm.`);
};

main().catch((error) => {
  console.error('Unexpected release script error:', error);
  process.exit(1);
});
