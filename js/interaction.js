import { parms } from './config.js';
import Hammer from 'hammerjs';

// MOBILE FIRST - Touch is primary, mouse is secondary
export function setupTouchInteraction(element) {
  const hammer = new Hammer.Manager(element, {
    touchAction: 'none',
    recognizers: [
      [Hammer.Pan, { direction: Hammer.DIRECTION_ALL, threshold: 0 }],
      [Hammer.Pinch, { enable: true }],
      [Hammer.Tap, { taps: 2 }]  // Double tap to reset
    ]
  });
  
  let startSwirlSpeed = parms.swirlSpeed;
  let startSlices = parms.slices;
  
  // PAN - Primary mobile interaction
  hammer.on('panstart', () => {
    startSwirlSpeed = parms.swirlSpeed;
    startSlices = parms.slices;
  });
  
  hammer.on('pan', (event) => {
    // Direct mapping for intuitive mobile control
    const normX = event.deltaX / window.innerWidth;
    const normY = event.deltaY / window.innerHeight;
    
    parms.swirlSpeed = Math.max(0.05, Math.min(0.65, startSwirlSpeed + normX * 0.5));
    parms.slices = Math.max(4, Math.min(16, Math.round(startSlices - normY * 8)));
  });
  
  // PINCH - Natural zoom gesture
  hammer.on('pinch', (event) => {
    parms.baseRadius = Math.max(0.2, Math.min(0.6, 0.4 * event.scale));
  });
  
  // DOUBLE TAP - Reset to mobile defaults
  hammer.on('tap', (event) => {
    // Prevent any default behavior
    event.preventDefault();
    parms.slices = 8;
    parms.swirlSpeed = 0.15;
    parms.baseRadius = 0.4;
  });
  
  // Essential touch preventions for mobile
  element.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  element.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
}

// Desktop enhancement - only if not touch device
export function setupDesktopInteraction() {
  if ('ontouchstart' in window) return;
  
  window.addEventListener('pointermove', e => {
    const normX = (e.clientX / window.innerWidth  - .5) * 2;
    const normY = (e.clientY / window.innerHeight - .5) * 2;
    parms.swirlSpeed = 0.05 + Math.abs(normX) * 0.6;
    parms.slices = 6 + Math.floor(Math.abs(normY) * 18);
  }, { passive: true });
}