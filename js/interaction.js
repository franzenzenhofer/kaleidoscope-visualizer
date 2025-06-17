import { parms } from './config.js';

// Hammer.js is loaded globally via CDN

let lastX = 0;
let lastY = 0;
let audioVisual = null; // Store reference to audio-visual mapper
let debugHUD = null; // Store reference to debug HUD

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
  originalSpeed: null, // For shake effect
  // NEW brightness physics
  luminance: 0.6,
  luminanceTarget: 0.6,
  // NEW scale spring physics
  scale: 1.0,
  scaleTarget: 1.0,
  scaleVelocity: 0,
  // NEW mode state
  mode: 'Calm', // 'Calm', 'Pulse', 'Rave'
  longPressTimer: null,
  debugHUD: false
};

// Helper function to notify audio visual of user interaction
function notifyUserInteraction(paramName, value) {
  if (audioVisual && audioVisual.onUserInteraction) {
    audioVisual.onUserInteraction(paramName, value);
  }
}

// Helper function to clamp values
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Set debug HUD reference
export function setDebugHUD(hud) {
  debugHUD = hud;
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
      [Hammer.Tap, { event: 'tripletap', taps: 3 }],
      [Hammer.Press, { time: 400 }] // Long press for debug HUD
    ]
  });
  
  // Enable pinch and rotate
  hammer.get('pinch').set({ enable: true });
  hammer.get('rotate').set({ enable: true });
  
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
    
    // Check if it's a three-finger gesture for brightness control
    if (event.pointers.length === 3) {
      // Vertical three-finger slide for brightness
      physics.luminanceTarget = clamp(physics.luminanceTarget - event.deltaY/800, 0.3, 1);
      notifyUserInteraction('luminance', physics.luminanceTarget);
      return; // Don't process other pan gestures
    }
    
    // Single finger: iPOD WHEEL behavior
    if (event.pointers.length === 1) {
      // iPOD WHEEL: Track circular motion speed around center
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const currentAngle = Math.atan2(event.center.y - centerY, event.center.x - centerX);
      
      let angleDelta = currentAngle - physics.lastRotationAngle;
      // Handle angle wrap
      if (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
      if (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;
      
      // iPOD WHEEL PHYSICS: Angular velocity determines rotation speed
      const angularVelocity = angleDelta / (deltaTime / 1000); // radians per second
      
      // Only respond to circular motion (not straight lines)
      const distanceFromCenter = Math.sqrt(
        Math.pow(event.center.x - centerX, 2) + 
        Math.pow(event.center.y - centerY, 2)
      );
      const screenSize = Math.min(window.innerWidth, window.innerHeight);
      const minRadius = screenSize * 0.2; // Wheel starts 20% from center
      const maxRadius = screenSize * 0.45; // Wheel ends at 45% from center
      
      // Check if we're in the wheel zone
      if (distanceFromCenter > minRadius && distanceFromCenter < maxRadius && Math.abs(angleDelta) > 0.0001) {
        // iPOD SENSITIVITY: More responsive to speed changes
        // Direct mapping - the speed you move is the speed it rotates
        let wheelSpeed = angularVelocity * 0.5; // Comfortable scaling
        
        // Add subtle acceleration for very fast movements
        if (Math.abs(angularVelocity) > 3) {
          wheelSpeed *= 1.2; // Boost for fast spins
        }
        
        // Smooth the speed changes slightly for comfort
        parms.swirlSpeed = parms.swirlSpeed * 0.7 + wheelSpeed * 0.3;
        parms.swirlSpeed = Math.max(-3, Math.min(3, parms.swirlSpeed));
        notifyUserInteraction('swirlSpeed', parms.swirlSpeed);
        
        // Reset momentum while actively scrolling
        physics.rotationVelocity = 0;
        
        // Visual feedback that we're in wheel mode
        physics.pulseSpeed = 0.1; // Subtle pulse
      }
    }
    
    lastX = event.center.x;
    lastY = event.center.y;
    physics.lastRotationAngle = Math.atan2(event.center.y - window.innerHeight/2, event.center.x - window.innerWidth/2);
    physics.lastRotationTime = currentTime;
  });
  
  hammer.on('panend', (event) => {
    // iPOD WHEEL: When finger lifts, rotation gradually slows down
    // The current swirl speed becomes the momentum
    physics.rotationVelocity = parms.swirlSpeed * 2; // Keep some momentum
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
  
  // Handle pinch for scale control with spring physics
  hammer.on('pinch pinchmove', (event) => {
    physics.scaleTarget = clamp(event.scale, 0.6, 1.8);
    notifyUserInteraction('scaleTarget', physics.scaleTarget);
  });
  
  // Handle rotate for hue drift control
  hammer.on('rotate rotatemove', (event) => {
    // Two-finger rotation controls hue drift
    parms.hueDrift = clamp(event.rotation / 180, -1, 1);
    notifyUserInteraction('hueDrift', parms.hueDrift);
  });
  
  // Double tap for mode cycle
  hammer.on('doubletap', (event) => {
    // Cycle through modes: Calm -> Pulse -> Rave
    const modes = ['Calm', 'Pulse', 'Rave'];
    const currentIndex = modes.indexOf(physics.mode);
    physics.mode = modes[(currentIndex + 1) % modes.length];
    
    // Notify of mode change
    notifyUserInteraction('mode', physics.mode);
    
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
  
  // Long press for debug HUD toggle
  hammer.on('press', (event) => {
    physics.debugHUD = !physics.debugHUD;
    notifyUserInteraction('debugHUD', physics.debugHUD);
    
    // Toggle HUD visibility
    if (debugHUD) {
      debugHUD.toggle();
    }
  });
  
  // Prevent default touch behavior
  element.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  element.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
}

// Update physics for toy-like motion
export function updateToyPhysics(deltaTime) {
  // iPOD WHEEL PHYSICS: Natural deceleration when not actively scrolling
  if (Math.abs(physics.rotationVelocity) > 0.001) {
    // Apply momentum
    parms.swirlSpeed = physics.rotationVelocity;
    notifyUserInteraction('swirlSpeed', parms.swirlSpeed);
    
    // Natural friction - like iPod wheel deceleration
    physics.rotationVelocity *= 0.92; // Faster deceleration, like real iPod
    
    // Stop when very slow
    if (Math.abs(physics.rotationVelocity) < 0.05) {
      physics.rotationVelocity = 0;
      parms.swirlSpeed = 0; // Full stop
      notifyUserInteraction('swirlSpeed', 0);
    }
  }
  
  // Scale spring physics
  const acc = (physics.scaleTarget - physics.scale) * 0.22;
  physics.scaleVelocity = (physics.scaleVelocity + acc) * 0.88;
  physics.scale += physics.scaleVelocity;
  parms.baseRadius = clamp(physics.scale * 0.35, 0.1, 0.6);
  notifyUserInteraction('baseRadius', parms.baseRadius);
  
  // Luminance lerp
  physics.luminance += (physics.luminanceTarget - physics.luminance) * 0.1;
  parms.luminance = physics.luminance;
  notifyUserInteraction('luminance', parms.luminance);
  
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

// Export physics for debug HUD
export { physics };