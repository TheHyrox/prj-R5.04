#!/usr/bin/env node
var spawnSync = require('child_process').spawnSync;
var fs = require('fs');
var path = require('path');

var workspaceRoot = path.resolve(__dirname, '..');
var packagesDir = path.join(workspaceRoot, 'packages');

var thresholds = {
  statements: 80,
  branches: 60,
  functions: 70,
  lines: 80
};

function run(cmd, args, opts) {
  opts = opts || {};
  console.log('> ' + cmd + ' ' + args.join(' '));
  var res = spawnSync(cmd, args, Object.assign({ stdio: 'inherit', cwd: workspaceRoot, shell: false }, opts));
  if (res.error) {
    console.error('Error running command', res.error);
    return res;
  }
  return res;
}

function checkPackage(pkg) {
  var pkgPath = path.join(packagesDir, pkg);
  var pkgJsonPath = path.join(pkgPath, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) return { skipped: true };
  var pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

  if (pkgJson.scripts && pkgJson.scripts['test']) {
    var testScript = pkgJson.scripts['test'];
    var isPlaceholder =
      /no tests specified/i.test(testScript) || (/exit 0/.test(testScript) && /echo/.test(testScript));
    if (isPlaceholder) {
      console.log('\nPackage ' + pkg + ' has a placeholder test script; skipping coverage.');
      return { pkg: pkg, skipped: true };
    }

    console.log('\nRunning coverage for package: ' + pkg);
    var res = run('npm', ['--workspace=' + pkg, 'run', 'test', '--', '--coverage', '--watchAll=false']);
    if (res.status !== 0) {
      return { pkg: pkg, ok: false, reason: 'tests-failed' };
    }
  } else {
    console.log('\nPackage ' + pkg + ' has no test script; skipping coverage.');
    return { pkg: pkg, skipped: true };
  }

  var summaryPath = path.join(pkgPath, 'coverage', 'coverage-summary.json');
  if (!fs.existsSync(summaryPath)) {
    console.warn(
      'Coverage summary not found for ' + pkg + ' at ' + summaryPath + ' — skipping coverage check for this package.'
    );
    return { pkg: pkg, skipped: true };
  }

  var summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  var totals = summary.total || {};
  var results = {};
  var pass = true;
  var keys = ['statements', 'branches', 'functions', 'lines'];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var pct = totals[key] && typeof totals[key].pct === 'number' ? totals[key].pct : 0;
    results[key] = pct;
    if (pct < thresholds[key]) pass = false;
  }

  return { pkg: pkg, ok: pass, results: results };
}

function main() {
  if (!fs.existsSync(packagesDir)) {
    console.error('No packages directory found; aborting coverage checks.');
    process.exit(1);
  }

  var dirents = fs.readdirSync(packagesDir);
  var pkgs = [];
  for (var j = 0; j < dirents.length; j++) {
    var d = dirents[j];
    if (fs.statSync(path.join(packagesDir, d)).isDirectory()) pkgs.push(d);
  }
  var failed = [];
  var skipped = [];

  for (var k = 0; k < pkgs.length; k++) {
    var pkg = pkgs[k];
    var res = checkPackage(pkg);
    if (res.skipped) skipped.push(pkg);
    else if (!res.ok) failed.push(res);
    else console.log('Coverage OK for ' + pkg + ':', res.results);
  }

  if (failed.length > 0) {
    console.error('\nCoverage thresholds not met:');
    for (var m = 0; m < failed.length; m++) {
      var f = failed[m];
      if (f.reason) console.error('- ' + f.pkg + ': ' + f.reason);
      else console.error('- ' + f.pkg + ':', f.results);
    }
    process.exit(1);
  }

  console.log('\nAll coverage checks passed for packages with coverage.');
  if (skipped.length > 0) console.log('Packages skipped (no tests/coverage):', skipped.join(', '));
  process.exit(0);
}

main();
