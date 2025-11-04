#!/usr/bin/env node
var spawnSync = require('child_process').spawnSync;
var fs = require('fs');
var path = require('path');

var files = process.argv.slice(2);
if (!files || files.length === 0) process.exit(0);

var workspaceRoot = path.resolve(__dirname, '..');
var packagesDir = path.join(workspaceRoot, 'packages');

function findPackageForFile(file) {
  var rel = path.relative(workspaceRoot, path.resolve(file)).split(path.sep);
  if (rel[0] === 'packages' && rel.length > 1) return rel[1];
  return null;
}

var filesByPackage = {};
for (var i = 0; i < files.length; i++) {
  var f = files[i];
  var pkg = findPackageForFile(f);
  if (!pkg) continue;
  filesByPackage[pkg] = filesByPackage[pkg] || [];
  filesByPackage[pkg].push(f);
}

function run(cmd, args) {
  console.log('> ' + cmd + ' ' + args.join(' '));
  var res = spawnSync(cmd, args, { stdio: 'inherit', cwd: workspaceRoot, shell: false });
  if (res.error) {
    console.error('Error running', cmd, res.error);
    process.exit(res.status || 1);
  }
  if (res.status !== 0) process.exit(res.status);
}

var pkgs = Object.keys(filesByPackage);
for (var j = 0; j < pkgs.length; j++) {
  var pkgName = pkgs[j];
  var pkgPath = path.join(packagesDir, pkgName);
  var pkgJsonPath = path.join(pkgPath, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) continue;
  var pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  var testScript = pkgJson.scripts && pkgJson.scripts.test ? pkgJson.scripts.test : null;
  var isPlaceholder =
    (testScript && /no tests specified/i.test(testScript)) ||
    (testScript && /exit 0/.test(testScript) && /echo/.test(testScript));
  if (!testScript || isPlaceholder) continue;

  // Run package's test script with --findRelatedTests and the file list
  var args = ['--workspace=' + pkgName, 'run', 'test', '--', '--findRelatedTests'].concat(filesByPackage[pkgName]);
  run('npm', args);
}

process.exit(0);
