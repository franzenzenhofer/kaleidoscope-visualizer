export const canvas = document.getElementById('c');
export const ctx = canvas.getContext('2d', { 
  alpha: false,
  desynchronized: true,
  willReadFrequently: false
});
export let w, h, dpr, midX, midY;

// MOBILE FIRST resize handler
export function resize() {
  // Mobile viewport is primary concern
  const viewport = window.visualViewport || window;
  const width = viewport.width || window.innerWidth;
  const height = viewport.height || window.innerHeight;
  
  // Start with mobile-optimized DPR
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  
  // Allow higher DPR only on desktop
  if (window.matchMedia('(min-width: 769px)').matches) {
    dpr = window.devicePixelRatio || 1;
  }
  
  w = width * dpr;
  h = height * dpr;
  
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  canvas.width = w;
  canvas.height = h;
  
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  midX = w / (2 * dpr);
  midY = h / (2 * dpr);
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