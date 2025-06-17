export const router = [
  { from: 'bass',     to: 'breath',      gain: 1.4,  curve: 'easeExp' },
  { from: 'bass',     to: 'luminance',   gain: 0.6 },
  { from: 'mid',      to: 'hueDrift',    gain: 0.3 },
  { from: 'treble',   to: 'sliceJitter', gain: 0.5 },
  { from: 'beat',     to: 'pulseKick',   gain: 1.0 }
];

// Curve functions for signal mapping
const curves = {
  linear: (x) => x,
  easeExp: (x) => x * x,
  easeSqrt: (x) => Math.sqrt(x),
  easeIn: (x) => x * x * x,
  easeOut: (x) => 1 - Math.pow(1 - x, 3)
};

// Apply routing to transform audio signals to visual parameters
export function applyRouting(audioSignals, visualParams) {
  const updates = {};
  
  router.forEach(route => {
    const signal = audioSignals[route.from] || 0;
    const curve = curves[route.curve] || curves.linear;
    const value = curve(signal) * route.gain;
    
    // Accumulate values if multiple routes target the same param
    if (updates[route.to]) {
      updates[route.to] += value;
    } else {
      updates[route.to] = value;
    }
  });
  
  return updates;
}

// Mode-specific router configurations
export const modeRouters = {
  Calm: [
    { from: 'bass',     to: 'breath',      gain: 0.8,  curve: 'easeSqrt' },
    { from: 'bass',     to: 'luminance',   gain: 0.3 },
    { from: 'mid',      to: 'hueDrift',    gain: 0.2 },
    { from: 'treble',   to: 'sliceJitter', gain: 0.2 }
  ],
  Pulse: [
    { from: 'bass',     to: 'breath',      gain: 1.4,  curve: 'easeExp' },
    { from: 'bass',     to: 'luminance',   gain: 0.6 },
    { from: 'mid',      to: 'hueDrift',    gain: 0.3 },
    { from: 'treble',   to: 'sliceJitter', gain: 0.5 },
    { from: 'beat',     to: 'pulseKick',   gain: 1.0 }
  ],
  Rave: [
    { from: 'bass',     to: 'breath',      gain: 2.0,  curve: 'easeExp' },
    { from: 'bass',     to: 'luminance',   gain: 0.9,  curve: 'easeExp' },
    { from: 'mid',      to: 'hueDrift',    gain: 0.5 },
    { from: 'treble',   to: 'sliceJitter', gain: 0.8 },
    { from: 'beat',     to: 'pulseKick',   gain: 1.5 },
    { from: 'treble',   to: 'ribbonHeight', gain: 1.2 }
  ]
};

// Get router configuration for current mode
export function getRouterForMode(mode) {
  return modeRouters[mode] || router;
}