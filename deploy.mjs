#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from 'fs';
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


    // Update manifest.json
    if (existsSync('public/manifest.json')) {
      const manifest = JSON.parse(readFileSync('public/manifest.json', 'utf8'));
      manifest.version = version;
      writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2));
      console.log('✅ Updated manifest.json');
    }

    // 3. Build the project
    console.log('\n🔨 Building project...');
    run('npm run build');
    console.log('✅ Build complete');

    // 4. Post-build cache busting for dist files
    console.log('\n🔄 Applying cache busters to built files...');
    
    // Update any imports in dist HTML files
    if (existsSync('dist/index.html')) {
      let distIndex = readFileSync('dist/index.html', 'utf8');
      
      // Vite already handles module imports, but let's ensure cache busting
      distIndex = distIndex.replace(/\.js\?v=[\d.]+/g, `.js?v=${version}`);
      distIndex = distIndex.replace(/\.css\?v=[\d.]+/g, `.css?v=${version}`);
      
      writeFileSync('dist/index.html', distIndex);
      console.log('✅ Updated dist/index.html');
    }

    // 5. Copy additional files
    console.log('\n📋 Copying additional files...');
    
    // Copy CNAME if it exists
    if (existsSync('CNAME')) {
      cpSync('CNAME', 'dist/CNAME');
      console.log('✅ Copied CNAME');
    }


    // 6. Create deployment info
    console.log('\n📝 Creating deployment info...');
    const deployInfo = {
      version,
      deployedAt: new Date().toISOString(),
      commit: getOutput('git rev-parse HEAD'),
      branch: getOutput('git rev-parse --abbrev-ref HEAD'),
      nodeVersion: process.version,
      buildTool: 'vite'
    };
    
    writeFileSync('dist/deploy-info.json', JSON.stringify(deployInfo, null, 2));
    console.log('✅ Created deploy-info.json');

    // 7. Commit version updates
    console.log('\n📌 Committing version updates...');
    run('git add -A', { ignoreError: true });
    run(`git commit -m "🔄 Update cache busters to v${version}"`, { ignoreError: true });

    // 8. Deploy to GitHub Pages
    console.log('\n🌐 Deploying to GitHub Pages...');
    
    // Ensure gh-pages branch exists
    const branches = getOutput('git branch -r');
    if (!branches.includes('origin/gh-pages')) {
      console.log('📌 Creating gh-pages branch...');
      run('git checkout --orphan gh-pages');
      run('git rm -rf .');
      run('git commit --allow-empty -m "Initial gh-pages commit"');
      run('git push origin gh-pages');
      run('git checkout main');
    }

    // Deploy using git subtree (force push to handle conflicts)
    run('git add dist -f');
    run(`git commit -m "Deploy: v${version}"`, { ignoreError: true });
    
    // Force push to gh-pages to avoid conflicts
    console.log('Force pushing to gh-pages...');
    run('git push origin `git subtree split --prefix dist main`:gh-pages --force');

    // 9. Push main branch changes
    console.log('\n📤 Pushing changes to main branch...');
    run('git push origin main');

    // 10. Create and push tag
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