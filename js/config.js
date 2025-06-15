// MOBILE FIRST - Default parameters optimized for mobile
export const defaultParms = {
  slices: 8,             // Optimized for mobile performance
  circles: 6,            // Fewer circles for smooth 60fps on phones
  baseRadius: 0.4,       // Larger for touch-friendly visuals
  swirlSpeed: 0.15,      // Slower for better mobile control
  hueSpeed: 30,          // Calmer color transitions
  sizeMod: 0.2           // Better visibility on small screens
};

// Live parameters that change with physics
export const parms = { ...defaultParms };

// Desktop enhancements for larger screens
export function enhanceForDesktop() {
  const isDesktop = window.matchMedia('(min-width: 769px) and (pointer: fine)').matches;
  
  if (isDesktop) {
    Object.assign(defaultParms, {
      slices: 12,
      circles: 8,
      baseRadius: 0.35,
      swirlSpeed: 0.25,
      hueSpeed: 40,
      sizeMod: 0.18
    });
    Object.assign(parms, defaultParms);
  }
}