export const canvas = document.getElementById('c');
// Feature detect P3 color space support
const contextOptions = { 
  alpha: false,
  desynchronized: true,
  willReadFrequently: false
};

// Only add colorSpace if supported
if (typeof OffscreenCanvasRenderingContext2D !== 'undefined' && 
    'colorSpace' in OffscreenCanvasRenderingContext2D.prototype) {
  contextOptions.colorSpace = 'display-p3';
}

export const ctx = canvas.getContext('2d', contextOptions);

// CRISP VISUALS: Set quality rendering hints
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

// Initialize with safe defaults to prevent non-finite errors
export let w = 100;
export let h = 100;
export let dpr = 1;
export let midX = 50;
export let midY = 50;

// MOBILE FIRST resize handler
export function resize() {
  // Use standard viewport dimensions
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Performance-optimized DPR limits
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  
  if (isMobile) {
    // Limit to 1.5 on mobile for better performance
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  } else {
    // Desktop can handle up to 2
    dpr = Math.min(window.devicePixelRatio || 1, 2);
  }
  
  // Canvas logical dimensions (CSS pixels)
  w = width;
  h = height;
  
  // Set actual canvas buffer size with DPR first
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  
  // Then set CSS size to avoid double reflow
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  
  // Scale the drawing context to match DPR
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  
  // Midpoints in logical pixels
  midX = width / 2;
  midY = height / 2;
}

// MOBILE FIRST orientation handling
export function setupMobileViewport() {
  // Visual viewport is crucial for mobile
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resize);
    window.visualViewport.addEventListener('scroll', resize);
  }
  
  // Orientation changes
  window.addEventListener('orientationchange', () => {
    // Immediate resize for mobile
    resize();
    // And again after rotation completes
    setTimeout(resize, 300);
  });
  
  // Also handle regular resize for desktop
  window.addEventListener('resize', resize, { passive: true });
}