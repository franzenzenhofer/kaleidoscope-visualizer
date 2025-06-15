import { resize, canvas, setupMobileViewport } from './canvas.js';
import { setupTouchInteraction, setupDesktopInteraction } from './interaction.js';
import { draw } from './renderer.js';
import { enhanceForDesktop } from './config.js';

// MOBILE FIRST initialization sequence
(() => {
  // 1. Setup mobile viewport handling first
  setupMobileViewport();
  resize();
  
  // 2. Touch interactions are primary
  setupTouchInteraction(canvas);
  
  // 3. Enhance for desktop if applicable
  enhanceForDesktop();
  setupDesktopInteraction();
  
  // 4. Critical mobile optimizations
  // Prevent ALL scrolling/bouncing and unwanted gestures
  document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
  document.addEventListener('gesturechange', e => e.preventDefault(), { passive: false });
  document.addEventListener('gestureend', e => e.preventDefault(), { passive: false });
  
  // Prevent double-tap zoom on iOS
  let lastTouchEnd = 0;
  document.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
  
  // Prevent context menu on long press
  document.addEventListener('contextmenu', e => e.preventDefault());
  
  // Lock viewport on mobile
  if ('orientation' in window) {
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
  }
  
  // 5. Start animation immediately for instant mobile feedback
  requestAnimationFrame(draw);
  
  // 6. Wake lock for mobile if available
  if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen').catch(() => {});
  }
})();