#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');
const packagesDir = path.join(workspaceRoot, 'packages');

const thresholds = {
  statements: 80,
  branches: 60,
  functions: 70,
  lines: 80
};

function run(cmd, args, opts = {}) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, Object.assign({ stdio: 'inherit', cwd: workspaceRoot, shell: false }, opts));
  if (res.error) {
    console.error('Error running command', res.error);
    return res;
  }
  return res;
}

function checkPackage(pkg) {
  const pkgPath = path.join(packagesDir, pkg);
  const pkgJsonPath = path.join(pkgPath, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) return { skipped: true };
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

  // If package has a test script, run it with coverage flag
  if (pkgJson.scripts && pkgJson.scripts['test']) {
    const testScript = pkgJson.scripts['test'];
    // Detect placeholder/test-stub scripts like: echo "No tests specified" && exit 0
    const isPlaceholder =
      /no tests specified/i.test(testScript) || (/exit 0/.test(testScript) && /echo/.test(testScript));
    if (isPlaceholder) {
      console.log(`\nPackage ${pkg} has a placeholder test script; skipping coverage.`);
      return { pkg, skipped: true };
    }

    console.log(`\nRunning coverage for package: ${pkg}`);
    // Try running coverage via npm workspace run test with coverage args
    const res = run('npm', ['--workspace=' + pkg, 'run', 'test', '--', '--coverage', '--watchAll=false']);
    if (res.status !== 0) {
      return { pkg, ok: false, reason: 'tests-failed' };
    }
  } else {
    console.log(`\nPackage ${pkg} has no test script; skipping coverage.`);
    return { pkg, skipped: true };
  }

  // Look for coverage summary
  const summaryPath = path.join(pkgPath, 'coverage', 'coverage-summary.json');
  if (!fs.existsSync(summaryPath)) {
    // If coverage wasn't produced, warn but don't fail the whole push — this allows gradual adoption.
    console.warn(`Coverage summary not found for ${pkg} at ${summaryPath} — skipping coverage check for this package.`);
    return { pkg, skipped: true };
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const totals = summary.total || {};
  const results = {};
  let pass = true;
  for (const key of ['statements', 'branches', 'functions', 'lines']) {
    const pct = totals[key] && typeof totals[key].pct === 'number' ? totals[key].pct : 0;
    results[key] = pct;
    if (pct < thresholds[key]) pass = false;
  }

  return { pkg, ok: pass, results };
}

function main() {
  if (!fs.existsSync(packagesDir)) {
    console.error('No packages directory found; aborting coverage checks.');
    process.exit(1);
  }

  const pkgs = fs.readdirSync(packagesDir).filter((d) => fs.statSync(path.join(packagesDir, d)).isDirectory());
  const failed = [];
  const skipped = [];

  for (const pkg of pkgs) {
    const res = checkPackage(pkg);
    if (res.skipped) skipped.push(pkg);
    else if (!res.ok) failed.push(res);
    else console.log(`Coverage OK for ${pkg}:`, res.results);
  }

  if (failed.length > 0) {
    console.error('\nCoverage thresholds not met:');
    for (const f of failed) {
      if (f.reason) console.error(`- ${f.pkg}: ${f.reason}`);
      else console.error(`- ${f.pkg}:`, f.results);
    }
    process.exit(1);
  }

  console.log('\nAll coverage checks passed for packages with coverage.');
  if (skipped.length > 0) console.log('Packages skipped (no tests/coverage):', skipped.join(', '));
  process.exit(0);
}

main();
