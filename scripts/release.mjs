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

const ensureNpmLogin = () => {
  const result = spawnSync('npm', ['whoami'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    console.error(
      '\n✖ Unable to determine npm user (`npm whoami` failed). ' +
        'You are likely not logged in or your auth token has expired.\n' +
        '  Run `npm login` to authenticate, then re-run this release script.',
    );
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

  ensureNpmLogin();

  if (hasUncommittedChanges()) {
    console.warn(
      '\n! Warning: working tree has uncommitted or staged changes.\n' +
        '  Release will proceed using the current state; stash or commit if this is not intended.',
    );
  }

  runStep('Building artifacts', 'npm', ['run', 'build']);
  runStep('Running full test suite', 'npm', ['run', 'test']);
  ensureDistOutputsExist();

  const currentVersion = readPackageVersion();

  let bumpType = '';
  while (!bumpType) {
    const choice = await prompt(
      'Select version bump: (p)atch / (m)inor / (M)ajor',
      'p',
    );
    const normalized = choice.toLowerCase();
    if (choice === 'M' || normalized === 'major') {
      bumpType = 'major';
    } else if (normalized === 'p' || normalized === 'patch') {
      bumpType = 'patch';
    } else if (normalized === 'm' || normalized === 'minor') {
      bumpType = 'minor';
    } else {
      console.log(
        'Unrecognized choice. Please enter "p", "m", "M", "minor", "major", or press Enter for patch.',
      );
    }
  }

  const newVersion = bumpSemver(currentVersion, bumpType);

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

  if (isDryRun) {
    console.log(
      `\nDry run: would bump version ${currentVersion} -> ${newVersion} (${bumpType}), publish css-calipers@${newVersion} to npm with dist-tag "${DIST_TAG}", then commit, tag, and push the release.`,
    );
    process.exit(0);
  }

  const confirm = await prompt(
    `Publish version ${newVersion} to npm? (y/N)`,
    'n',
  );
  if (!/^y(es)?$/i.test(confirm)) {
    console.log(
      `Release cancelled before publishing. Keeping version at ${currentVersion}.`,
    );
    process.exit(0);
  }

  runStep(
    `Bumping version to ${newVersion} (${bumpType})`,
    'npm',
    ['version', bumpType, '--no-git-tag-version'],
  );

  const updatedVersion = readPackageVersion();
  if (updatedVersion !== newVersion) {
    console.error(
      `\n✖ Version mismatch after bump. Expected ${newVersion}, found ${updatedVersion}. Aborting release.`,
    );
    process.exit(1);
  }

  console.log(
    `\n> Publishing ${newVersion} to npm (tag: ${DIST_TAG})`,
  );
  const publishResult = spawnSync(
    'npm',
    ['publish', '--tag', DIST_TAG],
    {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: { ...process.env, CSS_CALIPERS_RELEASE: '1' },
    },
  );
  if (publishResult.status !== 0) {
    console.error(
      `\n✖ Publishing ${newVersion} to npm (tag: ${DIST_TAG}) failed (exit code ${publishResult.status ?? 1}). Rolling back version to ${currentVersion}.`,
    );
    runStep(
      `Reverting version back to ${currentVersion}`,
      'npm',
      ['version', currentVersion, '--no-git-tag-version'],
    );
    process.exit(publishResult.status ?? 1);
  }
  console.log(`\n✓ Published css-calipers@${newVersion} to npm.`);

  const filesToStage = ['package.json'];
  if (existsSync('package-lock.json')) {
    filesToStage.push('package-lock.json');
  }

  runStep(
    `Staging release files for ${newVersion}`,
    'git',
    ['add', ...filesToStage],
  );
  runStep(
    `Committing release ${newVersion}`,
    'git',
    ['commit', '-m', `Release ${newVersion}`],
  );
  runStep(
    `Tagging release v${newVersion}`,
    'git',
    ['tag', `v${newVersion}`],
  );
  runStep(
    `Pushing main branch and tags`,
    'git',
    ['push', 'origin', 'main', '--follow-tags'],
  );
};

main().catch((error) => {
  console.error('Unexpected release script error:', error);
  process.exit(1);
});
