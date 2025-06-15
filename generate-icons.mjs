import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes we need to generate
const iconSizes = {
  // Favicons
  'favicon-16x16.png': { width: 16, height: 16 },
  'favicon-32x32.png': { width: 32, height: 32 },
  'favicon-96x96.png': { width: 96, height: 96 },
  
  // Apple Touch Icons
  'apple-touch-icon-57x57.png': { width: 57, height: 57 },
  'apple-touch-icon-60x60.png': { width: 60, height: 60 },
  'apple-touch-icon-72x72.png': { width: 72, height: 72 },
  'apple-touch-icon-76x76.png': { width: 76, height: 76 },
  'apple-touch-icon-114x114.png': { width: 114, height: 114 },
  'apple-touch-icon-120x120.png': { width: 120, height: 120 },
  'apple-touch-icon-144x144.png': { width: 144, height: 144 },
  'apple-touch-icon-152x152.png': { width: 152, height: 152 },
  'apple-touch-icon-180x180.png': { width: 180, height: 180 },
  
  // Android/Chrome
  'android-icon-36x36.png': { width: 36, height: 36 },
  'android-icon-48x48.png': { width: 48, height: 48 },
  'android-icon-72x72.png': { width: 72, height: 72 },
  'android-icon-96x96.png': { width: 96, height: 96 },
  'android-icon-144x144.png': { width: 144, height: 144 },
  'android-icon-192x192.png': { width: 192, height: 192 },
  'android-icon-512x512.png': { width: 512, height: 512 },
  
  // Social Media
  'og-image.png': { width: 1200, height: 630 },
  'twitter-card.png': { width: 1200, height: 600 },
  'facebook-share.png': { width: 1200, height: 630 },
  
  // Large format
  'icon-1024x1024.png': { width: 1024, height: 1024 },
};

async function captureKaleidoscopeIcons() {
  console.log('🎨 Starting kaleidoscope icon generation...');
  
  // Create icons directory
  const iconsDir = path.join(__dirname, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  // Launch browser
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ 
    headless: false, // Set to true for production
    args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Loading kaleidoscope at http://localhost:3000/...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    
    // Wait for the kaleidoscope to start rendering
    console.log('⏳ Waiting for kaleidoscope to initialize...');
    await page.waitForTimeout(3000);
    
    // Capture multiple cool variations
    const variations = [
      { 
        name: 'default', 
        description: 'Default kaleidoscope state' 
      },
      { 
        name: 'spinning', 
        description: 'Dynamic spinning pattern', 
        action: async () => {
          console.log('   🌀 Creating spinning motion...');
          await page.mouse.move(400, 300);
          await page.mouse.move(800, 400);
          await page.mouse.move(1200, 300);
          await page.waitForTimeout(1500);
        }
      },
      { 
        name: 'complex', 
        description: 'Complex multi-layered pattern', 
        action: async () => {
          console.log('   🔮 Creating complex patterns...');
          await page.mouse.move(200, 200);
          await page.mouse.move(1000, 600);
          await page.waitForTimeout(500);
          await page.mouse.move(600, 200);
          await page.mouse.move(1400, 800);
          await page.waitForTimeout(1500);
        }
      },
      { 
        name: 'colorful', 
        description: 'Vibrant colorful variation', 
        action: async () => {
          console.log('   🌈 Creating colorful patterns...');
          // Simulate organic mouse movement for natural color variations
          for (let i = 0; i < 8; i++) {
            const x = Math.random() * 1400 + 100;
            const y = Math.random() * 800 + 100;
            await page.mouse.move(x, y);
            await page.waitForTimeout(300);
          }
          await page.waitForTimeout(2000);
        }
      }
    ];
    
    // Generate icons for each variation
    for (const variation of variations) {
      console.log(`\n🌈 Capturing ${variation.description}...`);
      
      if (variation.action) {
        await variation.action();
      }
      
      // Wait for animation to settle
      console.log('   ⏳ Waiting for animation to settle...');
      await page.waitForTimeout(2000);
      
      // Create variation directory
      const variationDir = path.join(iconsDir, variation.name);
      if (!fs.existsSync(variationDir)) {
        fs.mkdirSync(variationDir, { recursive: true });
      }
      
      // Capture center square for icons
      const centerSize = 1024;
      const centerX = (1920 - centerSize) / 2;
      const centerY = (1080 - centerSize) / 2;
      
      console.log(`   📸 Taking screenshots...`);
      
      // Generate all icon sizes
      for (const [filename, size] of Object.entries(iconSizes)) {
        let screenshot;
        
        if (size.width === 1200 && size.height === 630) {
          // Social media images (16:9 aspect ratio)
          screenshot = await page.screenshot({
            type: 'png',
            clip: { x: 360, y: 225, width: 1200, height: 630 }
          });
        } else if (size.width === 1200 && size.height === 600) {
          // Twitter card
          screenshot = await page.screenshot({
            type: 'png',
            clip: { x: 360, y: 240, width: 1200, height: 600 }
          });
        } else {
          // Square icons - crop center square
          screenshot = await page.screenshot({
            type: 'png',
            clip: { x: centerX, y: centerY, width: centerSize, height: centerSize }
          });
        }
        
        fs.writeFileSync(path.join(variationDir, filename), screenshot);
      }
      
      console.log(`   ✅ Generated ${Object.keys(iconSizes).length} icons for ${variation.name}`);
    }
    
    // Select the best variation for the main icons
    const mainVariation = 'colorful';
    console.log(`\n🎯 Using '${mainVariation}' as main icon set...`);
    
    // Create public directory structure
    const publicDir = path.join(__dirname, 'public');
    const mainIconsDir = path.join(publicDir, 'icons');
    if (!fs.existsSync(mainIconsDir)) {
      fs.mkdirSync(mainIconsDir, { recursive: true });
    }
    
    // Copy main icons
    const sourceDir = path.join(iconsDir, mainVariation);
    for (const filename of Object.keys(iconSizes)) {
      const sourcePath = path.join(sourceDir, filename);
      const destPath = path.join(mainIconsDir, filename);
      fs.copyFileSync(sourcePath, destPath);
    }
    
    // Copy favicon to root
    console.log('🔗 Creating favicon.ico...');
    const favicon32Path = path.join(mainIconsDir, 'favicon-32x32.png');
    const faviconPath = path.join(__dirname, 'favicon.ico');
    fs.copyFileSync(favicon32Path, faviconPath.replace('.ico', '.png'));
    
    // Generate HTML meta tags and manifest
    generateMetaTags();
    
    console.log('\n🎉 Icon generation complete!');
    console.log(`📁 Main icons: ${mainIconsDir}`);
    console.log(`📁 All variations: ${iconsDir}`);
    console.log(`📝 Meta tags: ${path.join(__dirname, 'meta-tags.html')}`);
    console.log(`📱 PWA manifest: ${path.join(publicDir, 'manifest.json')}`);
    
  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

function generateMetaTags() {
  const metaTags = `<!-- Generated Kaleidoscope Icons -->
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="96x96" href="/icons/favicon-96x96.png">
<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png">

<!-- Apple Touch Icons -->
<link rel="apple-touch-icon" sizes="57x57" href="/icons/apple-touch-icon-57x57.png">
<link rel="apple-touch-icon" sizes="60x60" href="/icons/apple-touch-icon-60x60.png">
<link rel="apple-touch-icon" sizes="72x72" href="/icons/apple-touch-icon-72x72.png">
<link rel="apple-touch-icon" sizes="76x76" href="/icons/apple-touch-icon-76x76.png">
<link rel="apple-touch-icon" sizes="114x114" href="/icons/apple-touch-icon-114x114.png">
<link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon-120x120.png">
<link rel="apple-touch-icon" sizes="144x144" href="/icons/apple-touch-icon-144x144.png">
<link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png">

<!-- Android/Chrome Icons -->
<link rel="icon" type="image/png" sizes="36x36" href="/icons/android-icon-36x36.png">
<link rel="icon" type="image/png" sizes="48x48" href="/icons/android-icon-48x48.png">
<link rel="icon" type="image/png" sizes="72x72" href="/icons/android-icon-72x72.png">
<link rel="icon" type="image/png" sizes="96x96" href="/icons/android-icon-96x96.png">
<link rel="icon" type="image/png" sizes="144x144" href="/icons/android-icon-144x144.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icons/android-icon-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/icons/android-icon-512x512.png">

<!-- Social Media Meta Tags -->
<meta property="og:image" content="/icons/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta property="og:title" content="Dream Kaleido Flow - Interactive Audio Visualization">
<meta property="og:description" content="Beautiful kaleidoscope patterns that dance to your music and voice. Experience mesmerizing audio-visual harmony.">
<meta property="og:type" content="website">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="/icons/twitter-card.png">
<meta name="twitter:title" content="Dream Kaleido Flow">
<meta name="twitter:description" content="Interactive kaleidoscope visualization with audio reactivity">

<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#000000">
<meta name="background-color" content="#000000">`;

  const metaTagsPath = path.join(__dirname, 'meta-tags.html');
  fs.writeFileSync(metaTagsPath, metaTags);
  
  // Generate PWA manifest
  const manifest = {
    "name": "Dream Kaleido Flow",
    "short_name": "Kaleido Flow",
    "description": "Interactive kaleidoscope visualization with audio reactivity",
    "start_url": "/",
    "display": "fullscreen",
    "orientation": "any",
    "theme_color": "#000000",
    "background_color": "#000000",
    "icons": [
      {
        "src": "/icons/android-icon-36x36.png",
        "sizes": "36x36",
        "type": "image/png",
        "density": "0.75"
      },
      {
        "src": "/icons/android-icon-48x48.png",
        "sizes": "48x48",
        "type": "image/png",
        "density": "1.0"
      },
      {
        "src": "/icons/android-icon-72x72.png",
        "sizes": "72x72",
        "type": "image/png",
        "density": "1.5"
      },
      {
        "src": "/icons/android-icon-96x96.png",
        "sizes": "96x96",
        "type": "image/png",
        "density": "2.0"
      },
      {
        "src": "/icons/android-icon-144x144.png",
        "sizes": "144x144",
        "type": "image/png",
        "density": "3.0"
      },
      {
        "src": "/icons/android-icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png",
        "density": "4.0"
      },
      {
        "src": "/icons/android-icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any maskable"
      }
    ]
  };
  
  const publicDir = path.join(__dirname, 'public');
  const manifestPath = path.join(publicDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log('📝 Generated meta-tags.html with all icon references');
  console.log('📱 Generated manifest.json for PWA support');
}

// Run the script
captureKaleidoscopeIcons().catch(console.error); 