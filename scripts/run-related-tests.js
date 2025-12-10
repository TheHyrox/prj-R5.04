#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const files = process.argv.slice(2);
if (!files || files.length === 0) process.exit(0);

const workspaceRoot = path.resolve(__dirname, '..');
const packagesDir = path.join(workspaceRoot, 'packages');

function findPackageForFile(file) {
    const rel = path.relative(workspaceRoot, path.resolve(file)).split(path.sep);
    if (rel[0] === 'packages' && rel.length > 1) return rel[1];
    if (rel[0] === '' || rel[0] === '.') return '__root__';
    return null;
}

const filesByPackage = {};
for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const pkg = findPackageForFile(f);
    if (!pkg) continue;
    filesByPackage[pkg] = filesByPackage[pkg] || [];
    filesByPackage[pkg].push(f);
}

function run(cmd, args, cwd) {
    console.log('> ' + cmd + ' ' + args.join(' ') + ' (cwd: ' + cwd + ')');
    const res = spawnSync(cmd, args, { stdio: 'inherit', cwd });
    if (res.error) {
        console.error('Error running', cmd, res.error);
        process.exit(res.status || 1);
    }
    if (res.status !== 0) process.exit(res.status);
}

const pkgs = Object.keys(filesByPackage);
for (let j = 0; j < pkgs.length; j++) {
    const pkgName = pkgs[j];
    const pkgPath = pkgName === '__root__' ? workspaceRoot : path.join(packagesDir, pkgName);
    const pkgJsonPath = path.join(pkgPath, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) continue;

    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    const testScript = pkgJson.scripts && pkgJson.scripts.test ? pkgJson.scripts.test : null;
    const isPlaceholder =
        (testScript && /no tests specified/i.test(testScript)) ||
        (testScript && /exit 0/.test(testScript) && /echo/.test(testScript));
    if (!testScript || isPlaceholder) continue;

    const relatedFiles = filesByPackage[pkgName];
    const args = ['run', 'test', '--', '--findRelatedTests', ...relatedFiles];
    run('npm', args, pkgPath);
}

process.exit(0);