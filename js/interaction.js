import { parms } from './config.js';

// Hammer.js is loaded globally via CDN

let lastX = 0;
let lastY = 0;
let audioVisual = null; // Store reference to audio-visual mapper

// Physics state for toy-like interactions
const physics = {
  rotationVelocity: 0,
  rotationInertia: 0.98, // Higher = more momentum
  rotationFriction: 0.995, // Gradual slowdown
  lastRotationTime: 0,
  lastRotationAngle: 0,
  velocityHistory: [],
  maxVelocityHistory: 5,
  shakeMagnitude: 0,
  shakeDecay: 0.9,
  lastShakeTime: 0,
  pulsePhase: 0,
  pulseSpeed: 0,
  lastRotation: 0, // For tracking rotation gesture
  originalSpeed: null // For shake effect
};

// Helper function to notify audio visual of user interaction
function notifyUserInteraction(paramName, value) {
  if (audioVisual && audioVisual.onUserInteraction) {
    audioVisual.onUserInteraction(paramName, value);
  }
}

// Pointer tweaks: drag horizontally to change swirl, vertically to change slice count.
export function setupPointerInteraction(audioVisualMapper = null) {
  audioVisual = audioVisualMapper;
  
  // Only use pointer events on desktop
  if (!('ontouchstart' in window)) {
    window.addEventListener('pointermove', e => {
      const normX = (e.clientX / window.innerWidth  - .5) * 2;
      const normY = (e.clientY / window.innerHeight - .5) * 2;
      
      const newSwirlSpeed = 0.05 + Math.abs(normX) * 0.6;
      const newSlices = 6 + Math.floor(Math.abs(normY) * 18); // 6–24 slices
      
      parms.swirlSpeed = newSwirlSpeed;
      parms.slices = newSlices;
      
      // Notify audio visual of user interaction
      notifyUserInteraction('swirlSpeed', newSwirlSpeed);
      notifyUserInteraction('slices', newSlices);
    }, {passive:true});
  }
}

// Setup Hammer.js for touch gestures
export function setupHammerGestures(element, audioVisualMapper = null) {
  audioVisual = audioVisualMapper;
  
  const hammer = new Hammer.Manager(element, {
    touchAction: 'none',
    recognizers: [
      [Hammer.Pan, { direction: Hammer.DIRECTION_ALL, threshold: 0 }],
      [Hammer.Pinch, { enable: true }],
      [Hammer.Rotate, { enable: true }],
      [Hammer.Swipe, { direction: Hammer.DIRECTION_ALL, velocity: 0.3 }],
      [Hammer.Tap, { event: 'doubletap', taps: 2 }],
      [Hammer.Tap, { event: 'tripletap', taps: 3 }]
    ]
  });
  
  // Handle pan gestures - CIRCULAR MOTION like iPod wheel
  hammer.on('panstart', (event) => {
    lastX = event.center.x;
    lastY = event.center.y;
    physics.velocityHistory = [];
    physics.lastRotationTime = Date.now();
    
    // Calculate starting angle from center
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    physics.lastRotationAngle = Math.atan2(event.center.y - centerY, event.center.x - centerX);
  });
  
  hammer.on('panmove', (event) => {
    const currentTime = Date.now();
    const deltaTime = Math.max(1, currentTime - physics.lastRotationTime);
    
    // PHYSICAL OBJECT: Track circular motion around center
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const currentAngle = Math.atan2(event.center.y - centerY, event.center.x - centerX);
    
    let angleDelta = currentAngle - physics.lastRotationAngle;
    // Handle angle wrap
    if (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
    if (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;
    
    // INTUITIVE: Positive angle = clockwise rotation
    if (Math.abs(angleDelta) > 0.01) { // Only if significant movement
      // Direct mapping: finger moves clockwise = visual rotates clockwise
      const rotationSpeed = angleDelta * 2; // Amplify for responsiveness
      parms.swirlSpeed += rotationSpeed;
      parms.swirlSpeed = Math.max(-1, Math.min(1, parms.swirlSpeed));
      notifyUserInteraction('swirlSpeed', parms.swirlSpeed);
      
      // Store for momentum
      physics.velocityHistory.push(angleDelta * 100);
      if (physics.velocityHistory.length > physics.maxVelocityHistory) {
        physics.velocityHistory.shift();
      }
    }
    
    // LINEAR MOTION: Up/down for size, left/right for complexity
    const deltaX = event.center.x - lastX;
    const deltaY = event.center.y - lastY;
    
    // PHYSICAL: Vertical movement = SIZE (like stretching/squashing)
    if (Math.abs(deltaY) > 2) {
      // Moving UP = BIGGER, moving DOWN = SMALLER
      const sizeChange = -deltaY * 0.002; // Negative because up is negative Y
      const newBaseRadius = Math.max(0.1, Math.min(0.6, parms.baseRadius + sizeChange));
      parms.baseRadius = newBaseRadius;
      notifyUserInteraction('baseRadius', newBaseRadius);
      
      // Also adjust element size
      const newSizeMod = Math.max(0.05, Math.min(0.5, parms.sizeMod + sizeChange * 0.5));
      parms.sizeMod = newSizeMod;
      notifyUserInteraction('sizeMod', newSizeMod);
    }
    
    lastX = event.center.x;
    lastY = event.center.y;
    physics.lastRotationAngle = currentAngle;
    physics.lastRotationTime = currentTime;
  });
  
  hammer.on('panend', (event) => {
    // SMOOTH: Very gentle momentum
    if (physics.velocityHistory.length > 0) {
      const avgVelocity = physics.velocityHistory.reduce((a, b) => a + b, 0) / physics.velocityHistory.length;
      physics.rotationVelocity = avgVelocity * 0.05; // Much gentler momentum
    }
  });
  
  // Handle swipe for PHYSICAL transformations
  hammer.on('swipe', (event) => {
    const velocity = Math.sqrt(event.velocityX * event.velocityX + event.velocityY * event.velocityY);
    
    // PHYSICAL: Vertical swipes = SIZE changes (like pulling/pushing)
    if (Math.abs(event.velocityY) > Math.abs(event.velocityX)) {
      if (event.velocityY < 0) { // Swipe UP = EXPAND
        // Dramatic expansion
        const newBaseRadius = Math.min(0.6, parms.baseRadius * 1.4);
        parms.baseRadius = newBaseRadius;
        notifyUserInteraction('baseRadius', newBaseRadius);
        
        const newSizeMod = Math.min(0.5, parms.sizeMod * 1.3);
        parms.sizeMod = newSizeMod;
        notifyUserInteraction('sizeMod', newSizeMod);
        
        // Add bounce effect
        physics.pulseSpeed = velocity * 0.8;
      } else { // Swipe DOWN = CONTRACT
        // Dramatic contraction
        const newBaseRadius = Math.max(0.1, parms.baseRadius * 0.6);
        parms.baseRadius = newBaseRadius;
        notifyUserInteraction('baseRadius', newBaseRadius);
        
        const newSizeMod = Math.max(0.05, parms.sizeMod * 0.7);
        parms.sizeMod = newSizeMod;
        notifyUserInteraction('sizeMod', newSizeMod);
        
        // Add squeeze effect
        physics.pulseSpeed = velocity * 0.8;
      }
    }
    
    // PHYSICAL: Horizontal swipes = SPIN (like flicking a wheel)
    if (Math.abs(event.velocityX) > Math.abs(event.velocityY)) {
      // Strong spin momentum
      const direction = event.velocityX > 0 ? 1 : -1;
      physics.rotationVelocity = direction * velocity * 2.0; // Strong flick
      
      // Immediate visual feedback
      parms.swirlSpeed += direction * velocity * 0.3;
      parms.swirlSpeed = Math.max(-1.5, Math.min(1.5, parms.swirlSpeed));
      notifyUserInteraction('swirlSpeed', parms.swirlSpeed);
    }
  });
  
  // Handle pinch for INTUITIVE zoom control
  hammer.on('pinch', (event) => {
    // INTUITIVE: Pinch controls overall scale
    const scale = event.scale;
    
    // Base radius changes with pinch - expand/contract the whole pattern
    const currentRadius = parms.baseRadius;
    const newBaseRadius = Math.max(0.1, Math.min(0.6, currentRadius * scale));
    parms.baseRadius = newBaseRadius;
    notifyUserInteraction('baseRadius', newBaseRadius);
    
    // Size modification scales with pinch
    const currentSize = parms.sizeMod;
    const newSizeMod = Math.max(0.05, Math.min(0.6, currentSize * scale));
    parms.sizeMod = newSizeMod;
    notifyUserInteraction('sizeMod', newSizeMod);
    
    // Add smooth transition on pinch end
    if (event.isFinal) {
      physics.pulseSpeed = Math.abs(1 - scale) * 0.5;
    }
  });
  
  // Handle rotate for PHYSICAL rotation
  hammer.on('rotate', (event) => {
    // PHYSICAL: Two-finger rotation = direct control
    // event.rotation is cumulative degrees from start
    const rotationRadians = event.rotation * Math.PI / 180;
    
    // Direct rotation control - rotate the visual as fingers rotate
    parms.swirlSpeed = Math.max(-1.5, Math.min(1.5, rotationRadians * 0.3));
    notifyUserInteraction('swirlSpeed', parms.swirlSpeed);
    
    // Store rotation for momentum when gesture ends
    physics.lastRotation = event.rotation;
  });
  
  hammer.on('rotateend', (event) => {
    // Add momentum based on final rotation speed
    const finalRotation = event.rotation;
    const rotationDelta = finalRotation - (physics.lastRotation || 0);
    physics.rotationVelocity = rotationDelta * 0.1;
  });
  
  // Double tap for complexity toggle
  hammer.on('doubletap', (event) => {
    // INTUITIVE: Double tap cycles through complexity levels
    const complexityLevels = [
      { slices: 6, circles: 4 },   // Simple
      { slices: 10, circles: 7 },  // Medium
      { slices: 16, circles: 10 }  // Complex
    ];
    
    // Find current level and go to next
    let currentLevel = 0;
    for (let i = 0; i < complexityLevels.length; i++) {
      if (parms.slices >= complexityLevels[i].slices) {
        currentLevel = i;
      }
    }
    
    // Cycle to next level
    const nextLevel = (currentLevel + 1) % complexityLevels.length;
    const newSettings = complexityLevels[nextLevel];
    
    parms.slices = newSettings.slices;
    parms.circles = newSettings.circles;
    notifyUserInteraction('slices', newSettings.slices);
    notifyUserInteraction('circles', newSettings.circles);
    
    // Add visual feedback
    physics.pulseSpeed = 0.5;
  });
  
  // Triple tap for shake effect
  hammer.on('tripletap', (event) => {
    physics.shakeMagnitude = 20;
    physics.lastShakeTime = Date.now();
    
    // Scramble parameters
    const newSlices = Math.floor(Math.random() * 16) + 4;
    const newCircles = Math.floor(Math.random() * 8) + 3;
    const newHueSpeed = Math.random() * 60 + 20;
    
    parms.slices = newSlices;
    parms.circles = newCircles;
    parms.hueSpeed = newHueSpeed;
    
    notifyUserInteraction('slices', newSlices);
    notifyUserInteraction('circles', newCircles);
    notifyUserInteraction('hueSpeed', newHueSpeed);
  });
  
  // Prevent default touch behavior
  element.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  element.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
}

// Update physics for toy-like motion
export function updateToyPhysics(deltaTime) {
  // SMOOTH: Apply rotational velocity with heavy smoothing
  if (Math.abs(physics.rotationVelocity) > 0.001) {
    const defaultSpeed = 0.2; // Base speed to gravitate towards
    const maxSpeed = 0.8; // Lower maximum for smoother motion
    const minSpeed = -0.8;
    
    // Much gentler speed application
    let deltaSpeed = physics.rotationVelocity * deltaTime * 0.0003; // 3x slower
    let targetSpeed = parms.swirlSpeed + deltaSpeed;
    
    // Smooth clamping
    targetSpeed = Math.max(minSpeed, Math.min(maxSpeed, targetSpeed));
    
    // ULTRA SMOOTH: Heavy interpolation
    parms.swirlSpeed = parms.swirlSpeed * 0.95 + targetSpeed * 0.05;
    notifyUserInteraction('swirlSpeed', parms.swirlSpeed);
    
    // Stronger friction for quicker stop
    physics.rotationVelocity *= 0.98;
    
    // Stop when very slow
    if (Math.abs(physics.rotationVelocity) < 0.01) {
      physics.rotationVelocity = 0;
    }
  } else {
    // Smooth return to default
    const defaultSpeed = 0.2;
    if (Math.abs(parms.swirlSpeed - defaultSpeed) > 0.01) {
      parms.swirlSpeed = parms.swirlSpeed * 0.97 + defaultSpeed * 0.03;
    }
  }
  
  // Apply pulse effects
  if (physics.pulseSpeed > 0.01) {
    physics.pulsePhase += physics.pulseSpeed * deltaTime * 0.01;
    const pulse = Math.sin(physics.pulsePhase) * 0.05;
    const newSizeMod = Math.max(0.1, Math.min(0.5, parms.sizeMod + pulse));
    parms.sizeMod = newSizeMod;
    notifyUserInteraction('sizeMod', newSizeMod);
    
    physics.pulseSpeed *= 0.98; // Decay
  }
  
  // Apply shake effects
  if (physics.shakeMagnitude > 0.1) {
    // Store original speed before shake
    if (!physics.originalSpeed) {
      physics.originalSpeed = parms.swirlSpeed;
    }
    
    const shake = (Math.random() - 0.5) * physics.shakeMagnitude * 0.002;
    const shakenSpeed = Math.max(0, Math.min(2.0, physics.originalSpeed + shake));
    parms.swirlSpeed = shakenSpeed;
    notifyUserInteraction('swirlSpeed', shakenSpeed);
    
    physics.shakeMagnitude *= physics.shakeDecay;
    
    // Return to original speed when shake is done
    if (physics.shakeMagnitude < 0.1) {
      parms.swirlSpeed = physics.originalSpeed;
      physics.originalSpeed = null;
    }
  }
}

export function setupDeviceMotion(audioVisualMapper = null) {
  audioVisual = audioVisualMapper;
  
  if ('DeviceMotionEvent' in window) {
    window.addEventListener('devicemotion', (event) => {
      // Use accelerometer for tilt-based rotation
      if (event.accelerationIncludingGravity) {
        const x = event.accelerationIncludingGravity.x;
        const y = event.accelerationIncludingGravity.y;
        
        // Convert tilt to rotation speed (gentle)
        const tiltInfluence = (x / 10) * 0.1; // Scale down for subtlety
        const newSwirlSpeed = Math.max(0, Math.min(1, parms.swirlSpeed + tiltInfluence));
        parms.swirlSpeed = newSwirlSpeed;
        notifyUserInteraction('swirlSpeed', newSwirlSpeed);
        
        // Vertical tilt affects complexity
        const yInfluence = Math.abs(y) / 10;
        if (yInfluence > 0.3) {
          const newSlices = Math.max(4, Math.min(24, Math.round(6 + yInfluence * 18)));
          parms.slices = newSlices;
          notifyUserInteraction('slices', newSlices);
        }
      }
    }, { passive: true });
  }
}