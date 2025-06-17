#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, rmSync } from 'fs';
import { join } from 'path';

// Helper function to run shell commands
function run(command, options = {}) {
  console.log(`> ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit', ...options });
    return output;
  } catch (error) {
    if (!options.ignoreError) {
      throw error;
    }
    return null;
  }
}

// Helper function to get command output
function getOutput(command) {
  return execSync(command, { encoding: 'utf8' }).trim();
}

async function deploy() {
  console.log('🚀 Starting deployment process...\n');

  try {
    // 1. Get current version from package.json
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const version = packageJson.version;
    console.log(`📦 Current version: v${version}\n`);

    // 2. Update version in source files
    console.log('🔄 Updating version in source files...');
    
    // Create version.js
    const versionContent = `// Auto-generated version file
export const VERSION = '${version}';
export const BUILD_TIME = '${new Date().toISOString()}';
export const BUILD_COMMIT = '${getOutput('git rev-parse HEAD')}';
`;
    writeFileSync('js/version.js', versionContent);
    console.log('✅ Created js/version.js');

    // Update cache busters in index.html
    let indexHtml = readFileSync('index.html', 'utf8');
    
    // Update version query parameters
    indexHtml = indexHtml.replace(/\?v=[\d.]+/g, `?v=${version}`);
    
    // Add version to any local assets without version
    indexHtml = indexHtml.replace(/(<script[^>]+src=["'])((?!http)(?!.*\?v=)[^"']+\.js)["']/g, `$1$2?v=${version}"`);
    indexHtml = indexHtml.replace(/(<link[^>]+href=["'])((?!http)(?!.*\?v=)[^"']+\.css)["']/g, `$1$2?v=${version}"`);
    
    writeFileSync('index.html', indexHtml);
    console.log('✅ Updated cache busters in index.html');

    // Update service worker cache version
    if (existsSync('sw.js')) {
      let swContent = readFileSync('sw.js', 'utf8');
      swContent = swContent.replace(/const CACHE_VERSION = '[^']*'/g, `const CACHE_VERSION = 'v${version}'`);
      swContent = swContent.replace(/const VERSION = '[^']*'/g, `const VERSION = '${version}'`);
      writeFileSync('sw.js', swContent);
      console.log('✅ Updated service worker cache version');
    }

    // Update manifest.json
    if (existsSync('public/manifest.json')) {
      const manifest = JSON.parse(readFileSync('public/manifest.json', 'utf8'));
      manifest.version = version;
      writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2));
      console.log('✅ Updated manifest.json');
    }

    // 3. Commit version updates to main branch
    console.log('\n📌 Committing version updates...');
    run('git add -A', { ignoreError: true });
    run(`git commit -m "🔄 Update cache busters to v${version}"`, { ignoreError: true });
    run('git push origin main');

    // 4. Build the project
    console.log('\n🔨 Building project...');
    run('npm run build');
    console.log('✅ Build complete');

    // 5. Post-build processing
    console.log('\n📋 Processing built files...');
    
    // Copy CNAME if it exists
    if (existsSync('CNAME')) {
      cpSync('CNAME', 'dist/CNAME');
      console.log('✅ Copied CNAME');
    }

    // Copy service worker
    if (existsSync('sw.js')) {
      cpSync('sw.js', 'dist/sw.js');
      console.log('✅ Copied service worker');
    }

    // Create deployment info
    const deployInfo = {
      version,
      deployedAt: new Date().toISOString(),
      commit: getOutput('git rev-parse HEAD'),
      branch: getOutput('git rev-parse --abbrev-ref HEAD')
    };
    
    writeFileSync('dist/deploy-info.json', JSON.stringify(deployInfo, null, 2));
    console.log('✅ Created deploy-info.json');

    // 6. Deploy to GitHub Pages using simple method
    console.log('\n🌐 Deploying to GitHub Pages...');
    
    // Save current branch
    const currentBranch = getOutput('git rev-parse --abbrev-ref HEAD');
    
    // Copy dist to temporary location
    const tempDir = '.deploy-temp';
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
    cpSync('dist', tempDir, { recursive: true });
    
    // Switch to gh-pages branch
    try {
      run('git checkout gh-pages', { ignoreError: true });
    } catch (e) {
      // Create gh-pages if it doesn't exist
      run('git checkout -b gh-pages');
    }
    
    // Clean directory and copy new files
    run('git rm -rf .', { ignoreError: true });
    run('git clean -fxd', { ignoreError: true });
    
    // Copy files from temp directory
    cpSync(tempDir, '.', { recursive: true });
    rmSync(tempDir, { recursive: true });
    
    // Commit and push
    run('git add -A');
    run(`git commit -m "Deploy v${version}"`);
    run('git push origin gh-pages --force');
    
    // Switch back to original branch
    run(`git checkout ${currentBranch}`);

    // 7. Create and push tag
    console.log('\n🏷️  Creating release tag...');
    const tagMessage = `Release v${version} - ${new Date().toLocaleDateString()}`;
    run(`git tag -a "v${version}" -m "${tagMessage}"`, { ignoreError: true });
    run(`git push origin "v${version}"`, { ignoreError: true });

    // Success!
    console.log('\n✨ Deployment successful!');
    console.log(`🌍 Site deployed to: http://visuals.franzai.com/`);
    console.log(`📊 Version: v${version}`);
    console.log(`🏷️  Tagged as: v${version}`);
    console.log(`📅 Deployed at: ${new Date().toLocaleString()}`);

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
deploy();