// IMPROVED MOBILE CONFIGURATION - More desktop-like quality
export const parms = {
  slices: 10,            // Increased from 8 - more detail like desktop
  circles: 7,            // Increased from 6 - richer patterns
  baseRadius: 0.35,      // Decreased from 0.4 - more elements fit
  swirlSpeed: 0.2,       // Increased from 0.15 - more dynamic
  hueSpeed: 35,          // Slightly increased for better color flow
  sizeMod: 0.18,         // Decreased from 0.2 - finer elements
  luminance: 1.0,        // 0-1 master brightness
  hueDrift: 0            // audio / rotate gesture
};

// Store original defaults for reset functionality
export const defaultParms = {
  slices: 10,
  circles: 7,
  baseRadius: 0.35,
  swirlSpeed: 0.2,
  hueSpeed: 35,
  sizeMod: 0.18,
  luminance: 1.0,
  hueDrift: 0
};

// Desktop enhancements for larger screens - now closer to mobile
export function enhanceForDesktop() {
  const isDesktop = window.matchMedia('(min-width: 769px) and (pointer: fine)').matches;
  
  if (isDesktop) {
    parms.slices = 14;         // Increased detail for desktop
    parms.circles = 9;         // More complexity
    parms.baseRadius = 0.32;   // Slightly smaller for more elements
    parms.swirlSpeed = 0.25;   // Smooth motion
    parms.hueSpeed = 40;       // Rich color transitions
    parms.sizeMod = 0.16;      // Fine detail
    parms.luminance = 1.0;     // Full brightness default
    parms.hueDrift = 0;        // No initial drift
  }
}