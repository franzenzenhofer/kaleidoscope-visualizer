#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Get version from package.json
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const version = packageJson.version;

console.log(`📦 Updating version to ${version}...`);

// Update version.js
const versionFilePath = join('js', 'version.js');
const versionContent = `// Auto-generated version file
export const VERSION = '${version}';
export const BUILD_TIME = '${new Date().toISOString()}';
export const BUILD_COMMIT = '${process.env.GITHUB_SHA || 'local'}';
`;

writeFileSync(versionFilePath, versionContent);
console.log(`✅ Updated ${versionFilePath}`);

// Update main.js console log
const mainJsPath = join('js', 'main.js');
let mainJs = readFileSync(mainJsPath, 'utf8');

// Update version in console.log
mainJs = mainJs.replace(
  /console\.log\('🎨 Dream-Kaleido-Flow v[\d.]+/,
  `console.log('🎨 Dream-Kaleido-Flow v${version}`
);

writeFileSync(mainJsPath, mainJs);
console.log(`✅ Updated version in ${mainJsPath}`);

// Update index.html cache busters
const indexPath = 'index.html';
let indexHtml = readFileSync(indexPath, 'utf8');

// Add version to all local script and link tags
indexHtml = indexHtml.replace(/(<script[^>]+src=["'])((?!http)[^"']+\.js)["']/g, `$1$2?v=${version}"`);
indexHtml = indexHtml.replace(/(<link[^>]+href=["'])((?!http)[^"']+\.css)["']/g, `$1$2?v=${version}"`);

writeFileSync(indexPath, indexHtml);
console.log(`✅ Updated cache busters in ${indexPath}`);

// Update manifest.json if it exists
try {
  const manifestPath = join('public', 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.version = version;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✅ Updated ${manifestPath}`);
} catch (e) {
  // Manifest might not exist
}

console.log(`🎉 Version ${version} applied to all files!`);