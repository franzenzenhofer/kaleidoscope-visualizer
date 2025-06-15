export const canvas = document.getElementById('c');
export const ctx = canvas.getContext('2d', { 
  alpha: false,
  desynchronized: true,
  willReadFrequently: false
});
export let w, h, dpr, midX, midY;

// MOBILE FIRST resize handler
export function resize() {
  // Use standard viewport dimensions
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Start with mobile-optimized DPR
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  
  // Allow higher DPR only on desktop with good performance
  if (window.matchMedia('(min-width: 769px)').matches) {
    // Cap DPR to prevent performance issues and sizing problems
    dpr = Math.min(window.devicePixelRatio || 1, 2);
  }
  
  // Canvas logical dimensions (CSS pixels)
  w = width;
  h = height;
  
  // Set CSS size first
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  
  // Set actual canvas buffer size with DPR
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  
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