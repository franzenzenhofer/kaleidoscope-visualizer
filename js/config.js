// MOBILE FIRST - Default parameters optimized for mobile
export const parms = {
  slices: 8,             // Optimized for mobile performance
  circles: 6,            // Fewer circles for smooth 60fps on phones
  baseRadius: 0.4,       // Larger for touch-friendly visuals
  swirlSpeed: 0.15,      // Slower for better mobile control
  hueSpeed: 30,          // Calmer color transitions
  sizeMod: 0.2           // Better visibility on small screens
};

// Store original defaults for reset functionality
export const defaultParms = {
  slices: 8,
  circles: 6,
  baseRadius: 0.4,
  swirlSpeed: 0.15,
  hueSpeed: 30,
  sizeMod: 0.2
};

// Desktop enhancements for larger screens
export function enhanceForDesktop() {
  const isDesktop = window.matchMedia('(min-width: 769px) and (pointer: fine)').matches;
  
  if (isDesktop) {
    parms.slices = 12;
    parms.circles = 8;
    parms.baseRadius = 0.35;
    parms.swirlSpeed = 0.25;
    parms.hueSpeed = 40;
    parms.sizeMod = 0.18;
  }
}