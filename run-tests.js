#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Kajabi Theme System Test Suite');
console.log('==================================\n');

let passedTests = 0;
let failedTests = 0;

function runTest(name, testFn) {
  process.stdout.write(`Testing: ${name}... `);
  try {
    const result = testFn();
    if (result) {
      console.log('✅');
      passedTests++;
    } else {
      console.log('❌');
      failedTests++;
    }
  } catch (error) {
    console.log('❌');
    console.log(`  Error: ${error.message}`);
    failedTests++;
  }
}

function execTest(command) {
  try {
    execSync(command, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// Test Suite
console.log('1. Testing Shared Component Structure');
console.log('------------------------------------');
runTest('Shared styles directory exists', () => fs.existsSync('shared/styles'));
runTest('Shared snippets directory exists', () => fs.existsSync('shared/snippets'));
runTest('Shared scripts directory exists', () => fs.existsSync('shared/scripts'));
runTest('Shared variables file exists', () => fs.existsSync('shared/styles/core/_shared-variables.scss'));
runTest('Shared button component exists', () => fs.existsSync('shared/snippets/ui/button.liquid'));

console.log('\n2. Testing Theme Structure');
console.log('-------------------------');
runTest('Landing theme directory exists', () => fs.existsSync('themes/landing'));
runTest('Landing theme has templates', () => fs.existsSync('themes/landing/templates/index.liquid'));
runTest('Landing theme has config', () => fs.existsSync('themes/landing/config/settings_schema.json'));

console.log('\n3. Testing Build System');
console.log('----------------------');
runTest('Build landing theme', () => execTest('node build-themes.js build landing'));
runTest('Built theme exists in dist', () => fs.existsSync('dist/landing'));
runTest('Built theme has assets', () => fs.existsSync('dist/landing/assets'));
runTest('Built theme has shared snippets', () => fs.existsSync('dist/landing/snippets/shared'));
runTest('Built theme has styles.scss.liquid', () => fs.existsSync('dist/landing/assets/styles.scss.liquid'));

console.log('\n4. Testing Export System');
console.log('-----------------------');
runTest('Create development build', () => execTest('node theme-manager.js dev landing'));
runTest('Export directory exists', () => fs.existsSync('exports'));
runTest('Dev builds directory exists', () => fs.existsSync('exports/dev'));
runTest('Releases directory exists', () => fs.existsSync('exports/releases'));

console.log('\n5. Testing Validation');
console.log('--------------------');
runTest('Validation script exists', () => fs.existsSync('./validate-theme-build.sh'));
runTest('Validate built theme', () => execTest('./validate-theme-build.sh landing'));

console.log('\n6. Testing Version Management');
console.log('----------------------------');
runTest('Version config exists', () => fs.existsSync('theme-versions.json'));
runTest('Changelog exists', () => fs.existsSync('CHANGELOG.md'));

console.log('\n7. Testing Shared Component Integration');
console.log('--------------------------------------');
// Check if shared components are properly copied
const sharedButtonPath = 'dist/landing/snippets/shared/ui/button.liquid';
runTest('Shared button snippet copied to build', () => fs.existsSync(sharedButtonPath));

// Check if styles are properly compiled
const themeCssPath = 'dist/landing/assets/theme.css';
runTest('Theme CSS compiled', () => fs.existsSync(themeCssPath));

// Check if liquid variables are included
const liquidVarsPath = 'dist/landing/assets/liquid-variables.scss.liquid';
runTest('Liquid variables file copied', () => fs.existsSync(liquidVarsPath));

console.log('\n8. Testing Export Contents');
console.log('-------------------------');
// Find the latest export
const releases = fs.readdirSync('exports/releases').filter(d => d.startsWith('v'));
if (releases.length > 0) {
  const latestRelease = releases.sort().pop();
  const zipFiles = fs.readdirSync(`exports/releases/${latestRelease}`).filter(f => f.endsWith('.zip'));
  
  runTest('Export ZIP created', () => zipFiles.length > 0);
  runTest('Export metadata created', () => fs.existsSync(`exports/releases/${latestRelease}/metadata.json`));
  
  if (zipFiles.length > 0) {
    const zipPath = path.join('exports/releases', latestRelease, zipFiles[0]);
    runTest('Export ZIP size > 0', () => fs.statSync(zipPath).size > 0);
  }
}

// Summary
console.log('\n==================================');
console.log('Test Summary');
console.log('==================================');
console.log(`Tests Passed: ${passedTests} ✅`);
console.log(`Tests Failed: ${failedTests} ❌`);

if (failedTests === 0) {
  console.log('\nAll tests passed! 🎉');
  process.exit(0);
} else {
  console.log('\nSome tests failed. Please check the output above.');
  process.exit(1);
}