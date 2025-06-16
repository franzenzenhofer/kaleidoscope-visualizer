import { chromium } from 'playwright';

async function testApp() {
  console.log('🧪 Testing Dream-Kaleido-Flow app...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      permissions: ['microphone']
    });
    
    const page = await context.newPage();
    
    // Listen for console errors
    let hasErrors = false;
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Console error:', msg.text());
        hasErrors = true;
      }
    });
    
    // Navigate to the app
    console.log('📱 Loading app...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Wait for canvas to be ready
    console.log('🎨 Waiting for canvas...');
    await page.waitForSelector('canvas#c', { timeout: 5000 });
    
    // Check if canvas is rendering
    const canvasHandle = await page.$('canvas#c');
    const canvasBox = await canvasHandle.boundingBox();
    
    if (!canvasBox || canvasBox.width === 0 || canvasBox.height === 0) {
      throw new Error('Canvas has no dimensions');
    }
    
    console.log(`✅ Canvas ready: ${canvasBox.width}x${canvasBox.height}`);
    
    // Wait a bit to ensure no startup errors
    await page.waitForTimeout(2000);
    
    // Test touch interactions
    console.log('👆 Testing touch interactions...');
    
    // Test swipe
    await page.mouse.move(640, 360);
    await page.mouse.down();
    await page.mouse.move(740, 360, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    
    // Test pinch (simulate with mouse)
    await page.mouse.move(640, 360);
    await page.mouse.down();
    await page.mouse.move(540, 260, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('📸 Screenshot saved');
    
    // Check for errors
    if (hasErrors) {
      throw new Error('Console errors detected during test');
    }
    
    console.log('✅ All tests passed!');
    
  } finally {
    await browser.close();
  }
}

// Run the test
testApp().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});