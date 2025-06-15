import { parms } from './config.js';
import Hammer from 'hammerjs';

let lastX = 0;
let lastY = 0;

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
  pulseSpeed: 0
};

// Pointer tweaks: drag horizontally to change swirl, vertically to change slice count.
export function setupPointerInteraction() {
  // Only use pointer events on desktop
  if (!('ontouchstart' in window)) {
    window.addEventListener('pointermove', e => {
      const normX = (e.clientX / window.innerWidth  - .5) * 2;
      const normY = (e.clientY / window.innerHeight - .5) * 2;
      parms.swirlSpeed = 0.05 + Math.abs(normX) * 0.6;
      parms.slices     = 6 + Math.floor(Math.abs(normY) * 18); // 6–24 slices
    }, {passive:true});
  }
}

// Setup Hammer.js for touch gestures
export function setupHammerGestures(element) {
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
  
  // Handle pan gestures with velocity tracking
  hammer.on('panstart', (event) => {
    lastX = event.center.x;
    lastY = event.center.y;
    physics.velocityHistory = [];
    physics.lastRotationTime = Date.now();
    
    // Calculate starting angle for circular motion
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    physics.lastRotationAngle = Math.atan2(event.center.y - centerY, event.center.x - centerX);
  });
  
  hammer.on('panmove', (event) => {
    const currentTime = Date.now();
    const deltaTime = Math.max(1, currentTime - physics.lastRotationTime);
    
    // Calculate circular motion
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const currentAngle = Math.atan2(event.center.y - centerY, event.center.x - centerX);
    
    let angleDelta = currentAngle - physics.lastRotationAngle;
    // Handle angle wrap
    if (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
    if (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;
    
    // Calculate angular velocity
    const angularVelocity = angleDelta / deltaTime * 1000; // rad/s
    
    // Store velocity history for momentum calculation
    physics.velocityHistory.push(angularVelocity);
    if (physics.velocityHistory.length > physics.maxVelocityHistory) {
      physics.velocityHistory.shift();
    }
    
    // Apply immediate rotation based on gesture
    physics.rotationVelocity = angularVelocity * 0.15;
    
    // Also handle linear controls for other parameters
    const deltaX = event.center.x - lastX;
    const deltaY = event.center.y - lastY;
    
    // Vertical movement changes slices (like adjusting a dial)
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      parms.slices = Math.max(4, Math.min(24, Math.round(parms.slices - deltaY * 0.02)));
    }
    
    lastX = event.center.x;
    lastY = event.center.y;
    physics.lastRotationAngle = currentAngle;
    physics.lastRotationTime = currentTime;
  });
  
  hammer.on('panend', (event) => {
    // Calculate average velocity for momentum
    if (physics.velocityHistory.length > 0) {
      const avgVelocity = physics.velocityHistory.reduce((a, b) => a + b, 0) / physics.velocityHistory.length;
      physics.rotationVelocity = avgVelocity * 0.2; // Scale down for control
    }
  });
  
  // Handle swipe for quick spins
  hammer.on('swipe', (event) => {
    // Swipe velocity determines spin speed
    const velocity = Math.sqrt(event.velocityX * event.velocityX + event.velocityY * event.velocityY);
    const direction = Math.atan2(event.velocityY, event.velocityX);
    
    // Horizontal swipes spin the kaleidoscope
    if (Math.abs(event.velocityX) > Math.abs(event.velocityY)) {
      physics.rotationVelocity = event.velocityX * 0.5;
      // Add a pulse effect on swipe
      physics.pulseSpeed = velocity * 0.3;
    }
    
    // Vertical swipes change complexity
    if (Math.abs(event.velocityY) > Math.abs(event.velocityX)) {
      if (event.velocityY < 0) { // Swipe up = more complex
        parms.slices = Math.min(24, parms.slices + 4);
        parms.circles = Math.min(12, parms.circles + 2);
      } else { // Swipe down = simpler
        parms.slices = Math.max(4, parms.slices - 4);
        parms.circles = Math.max(3, parms.circles - 2);
      }
    }
  });
  
  // Handle pinch for sizing with spring effect
  hammer.on('pinch', (event) => {
    const targetSize = 0.18 * event.scale;
    parms.sizeMod = Math.max(0.1, Math.min(0.5, targetSize));
    
    // Add spring bounce on pinch end
    if (event.isFinal) {
      physics.pulseSpeed = Math.abs(1 - event.scale) * 0.5;
    }
  });
  
  // Handle rotate for direct rotation control
  hammer.on('rotate', (event) => {
    // Direct rotation maps to kaleidoscope rotation
    physics.rotationVelocity = event.rotation * 0.01;
    
    // Also adjust hue speed based on rotation speed
    parms.hueSpeed = Math.max(10, Math.min(100, 40 + Math.abs(event.rotation) / 2));
  });
  
  // Double tap for spin boost
  hammer.on('doubletap', (event) => {
    // Tap location determines spin direction
    const centerX = window.innerWidth / 2;
    const x = event.center.x - centerX;
    
    // Add rotational impulse based on tap location
    physics.rotationVelocity += (x / centerX) * 0.8;
    
    // Random pattern change
    if (Math.random() > 0.5) {
      parms.slices = Math.floor(Math.random() * 12) + 6;
      parms.circles = Math.floor(Math.random() * 6) + 4;
    }
  });
  
  // Triple tap for shake effect
  hammer.on('tripletap', (event) => {
    physics.shakeMagnitude = 20;
    physics.lastShakeTime = Date.now();
    
    // Scramble parameters
    parms.slices = Math.floor(Math.random() * 16) + 4;
    parms.circles = Math.floor(Math.random() * 8) + 3;
    parms.hueSpeed = Math.random() * 60 + 20;
  });
  
  // Prevent default touch behavior
  element.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  element.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
}

// Update physics for toy-like motion
export function updateToyPhysics(deltaTime) {
  // Apply rotational velocity with momentum
  if (Math.abs(physics.rotationVelocity) > 0.001) {
    parms.swirlSpeed += physics.rotationVelocity * deltaTime * 0.001;
    
    // Apply friction
    physics.rotationVelocity *= physics.rotationFriction;
    
    // Stop when very slow
    if (Math.abs(physics.rotationVelocity) < 0.001) {
      physics.rotationVelocity = 0;
    }
  }
  
  // Clamp swirl speed
  parms.swirlSpeed = Math.max(-1.0, Math.min(1.0, parms.swirlSpeed));
  
  // Apply shake effect
  if (physics.shakeMagnitude > 0.1) {
    const shakeX = (Math.random() - 0.5) * physics.shakeMagnitude;
    const shakeY = (Math.random() - 0.5) * physics.shakeMagnitude;
    
    // Shake affects multiple parameters for chaotic feel
    parms.swirlSpeed += shakeX * 0.01;
    parms.hueSpeed = Math.max(10, Math.min(100, parms.hueSpeed + shakeY));
    
    physics.shakeMagnitude *= physics.shakeDecay;
  }
  
  // Apply pulse effect
  if (physics.pulseSpeed > 0.01) {
    physics.pulsePhase += physics.pulseSpeed * deltaTime * 0.01;
    const pulse = Math.sin(physics.pulsePhase) * physics.pulseSpeed;
    
    parms.sizeMod = Math.max(0.1, Math.min(0.5, 0.2 + pulse * 0.1));
    physics.pulseSpeed *= 0.95; // Decay
  }
  
  // Natural slowdown when no interaction (like a real spinning toy)
  if (Math.abs(parms.swirlSpeed) > 0.05 && physics.rotationVelocity === 0) {
    parms.swirlSpeed *= 0.999;
  }
}

// Device motion for tilt controls (if available)
export function setupDeviceMotion() {
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (event) => {
      if (event.beta !== null && event.gamma !== null) {
        // Tilt affects rotation speed
        const tiltX = event.gamma / 90; // -1 to 1
        const tiltY = event.beta / 180; // -1 to 1
        
        // Only apply tilt if significant
        if (Math.abs(tiltX) > 0.1) {
          physics.rotationVelocity += tiltX * 0.02;
        }
        
        // Forward/back tilt affects pattern complexity
        if (Math.abs(tiltY) > 0.2) {
          const targetSlices = 12 + Math.round(tiltY * 8);
          parms.slices = Math.max(4, Math.min(24, targetSlices));
        }
      }
    });
  }
}