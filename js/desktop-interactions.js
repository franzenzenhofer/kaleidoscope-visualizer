import { parms, defaultParms } from './config.js';

// Desktop interaction state
let desktopState = {
  mouseDown: false,
  lastX: 0,
  lastY: 0,
  startX: 0,
  startY: 0,
  wheelMomentum: 0,
  lastInteraction: Date.now(),
  keys: new Set()
};

export function setupDesktopInteractions(element) {
  // MOUSE WHEEL - Spin the kaleidoscope like a real wheel!
  element.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    // Calculate wheel velocity
    const delta = e.deltaY * 0.002;
    const wheelSpeed = Math.abs(delta);
    
    // Accumulate momentum - faster scrolling = more spin
    desktopState.wheelMomentum += delta * (1 + wheelSpeed * 2);
    
    // Direct speed boost for immediate feedback
    parms.swirlSpeed += delta * 0.5;
    
    // Clamp maximum speed
    parms.swirlSpeed = Math.max(-1.2, Math.min(1.2, parms.swirlSpeed));
    desktopState.wheelMomentum = Math.max(-2, Math.min(2, desktopState.wheelMomentum));
    
    // Shift + wheel changes zoom with spring effect
    if (e.shiftKey) {
      const zoomDelta = delta * 0.15;
      parms.baseRadius *= (1 - zoomDelta);
      parms.baseRadius = Math.max(0.2, Math.min(0.6, parms.baseRadius));
      
      // Add bounce effect
      parms.sizeMod = 0.2 + Math.sin(Date.now() * 0.01) * wheelSpeed * 0.1;
    }
    
    // Ctrl + wheel changes slices with acceleration
    if (e.ctrlKey || e.metaKey) {
      const sliceChange = Math.round(Math.sign(delta) * (1 + wheelSpeed * 3));
      parms.slices += sliceChange;
      parms.slices = Math.max(3, Math.min(24, parms.slices));
      
      // Color shift on complexity change
      parms.hueSpeed = 40 + wheelSpeed * 20;
    }
    
    desktopState.lastInteraction = Date.now();
  }, { passive: false });
  
  // MOUSE DRAG - Direct control
  element.addEventListener('mousedown', (e) => {
    desktopState.mouseDown = true;
    desktopState.startX = e.clientX;
    desktopState.startY = e.clientY;
    desktopState.lastX = e.clientX;
    desktopState.lastY = e.clientY;
    
    // Different buttons do different things
    if (e.button === 2) { // Right click
      e.preventDefault();
      // Right click freezes motion
      parms.swirlSpeed = 0;
    }
  });
  
  element.addEventListener('mousemove', (e) => {
    if (!desktopState.mouseDown) return;
    
    const deltaX = e.clientX - desktopState.lastX;
    const deltaY = e.clientY - desktopState.lastY;
    
    if (e.shiftKey) {
      // Shift + drag = fine control
      parms.swirlSpeed += deltaX * 0.0005;
      parms.slices = Math.max(4, Math.min(24, parms.slices - Math.round(deltaY * 0.02)));
    } else if (e.altKey) {
      // Alt + drag = change colors
      parms.hueSpeed = Math.max(10, Math.min(100, defaultParms.hueSpeed + deltaX * 0.5));
      parms.circles = Math.max(3, Math.min(12, parms.circles - Math.round(deltaY * 0.02)));
    } else {
      // Normal drag = spin control
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const angle = Math.atan2(deltaY, deltaX);
      
      // Circular motion detection
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const lastAngle = Math.atan2(desktopState.lastY - centerY, desktopState.lastX - centerX);
      let angleDelta = currentAngle - lastAngle;
      
      // Handle angle wrap
      if (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
      if (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;
      
      // Apply rotation
      parms.swirlSpeed += angleDelta * 0.5;
      parms.swirlSpeed = Math.max(-0.8, Math.min(0.8, parms.swirlSpeed));
    }
    
    desktopState.lastX = e.clientX;
    desktopState.lastY = e.clientY;
    desktopState.lastInteraction = Date.now();
  });
  
  element.addEventListener('mouseup', () => {
    desktopState.mouseDown = false;
  });
  
  // DOUBLE CLICK - Random reset
  element.addEventListener('dblclick', (e) => {
    e.preventDefault();
    
    // Same as double tap - random configuration
    parms.slices = Math.floor(Math.random() * 12) + 6;
    parms.circles = Math.floor(Math.random() * 6) + 4;
    parms.swirlSpeed = (Math.random() - 0.5) * 0.4;
    parms.hueSpeed = Math.random() * 40 + 20;
    parms.baseRadius = Math.random() * 0.2 + 0.3;
    
    // Spin based on click location
    const x = e.clientX / window.innerWidth - 0.5;
    parms.swirlSpeed += x;
    
    desktopState.lastInteraction = Date.now();
  });
  
  // KEYBOARD CONTROLS
  window.addEventListener('keydown', (e) => {
    desktopState.keys.add(e.key);
    
    switch(e.key) {
      case 'ArrowLeft':
        parms.swirlSpeed -= 0.05;
        break;
      case 'ArrowRight':
        parms.swirlSpeed += 0.05;
        break;
      case 'ArrowUp':
        parms.slices = Math.min(24, parms.slices + 1);
        break;
      case 'ArrowDown':
        parms.slices = Math.max(4, parms.slices - 1);
        break;
      case ' ':
        // Spacebar = pause/resume
        e.preventDefault();
        if (Math.abs(parms.swirlSpeed) > 0.01) {
          desktopState.pausedSpeed = parms.swirlSpeed;
          parms.swirlSpeed = 0;
        } else if (desktopState.pausedSpeed) {
          parms.swirlSpeed = desktopState.pausedSpeed;
        }
        break;
      case 'r':
        // R = reverse
        parms.swirlSpeed = -parms.swirlSpeed;
        parms.hueSpeed = -parms.hueSpeed;
        break;
      case '+':
      case '=':
        parms.baseRadius = Math.min(0.6, parms.baseRadius * 1.1);
        break;
      case '-':
        parms.baseRadius = Math.max(0.2, parms.baseRadius * 0.9);
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        // Number keys = preset patterns
        const presets = {
          '1': { slices: 6, circles: 4, swirlSpeed: 0.1 },
          '2': { slices: 8, circles: 6, swirlSpeed: 0.15 },
          '3': { slices: 12, circles: 8, swirlSpeed: 0.2 },
          '4': { slices: 16, circles: 6, swirlSpeed: -0.1 },
          '5': { slices: 3, circles: 12, swirlSpeed: 0.3 },
          '6': { slices: 24, circles: 3, swirlSpeed: 0.05 },
          '7': { slices: 5, circles: 7, swirlSpeed: -0.25 },
          '8': { slices: 10, circles: 10, swirlSpeed: 0.4 },
          '9': { slices: 20, circles: 5, swirlSpeed: -0.15 }
        };
        if (presets[e.key]) {
          Object.assign(parms, presets[e.key]);
        }
        break;
    }
    
    desktopState.lastInteraction = Date.now();
  });
  
  window.addEventListener('keyup', (e) => {
    desktopState.keys.delete(e.key);
  });
  
  // Mouse enter/leave effects
  element.addEventListener('mouseenter', () => {
    // Subtle speed boost on hover
    parms.hueSpeed = defaultParms.hueSpeed * 1.2;
  });
  
  element.addEventListener('mouseleave', () => {
    desktopState.mouseDown = false;
    desktopState.lastInteraction = Date.now();
  });
  
  // Right click menu prevention
  element.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
}

// Update desktop physics
export function updateDesktopPhysics() {
  // Apply wheel momentum with realistic physics
  if (Math.abs(desktopState.wheelMomentum) > 0.001) {
    // Transfer momentum to swirl speed
    parms.swirlSpeed += desktopState.wheelMomentum * 0.02;
    
    // Apply different friction based on speed (faster = more air resistance)
    const speedFactor = Math.abs(desktopState.wheelMomentum);
    const friction = 0.98 - speedFactor * 0.02; // More friction at higher speeds
    desktopState.wheelMomentum *= friction;
    
    // Stop when very slow
    if (Math.abs(desktopState.wheelMomentum) < 0.001) {
      desktopState.wheelMomentum = 0;
    }
    
    // Clamp speed
    parms.swirlSpeed = Math.max(-1.2, Math.min(1.2, parms.swirlSpeed));
  }
  
  // Natural deceleration (like a real spinning toy)
  if (Math.abs(parms.swirlSpeed) > 0.01 && desktopState.wheelMomentum === 0 && !desktopState.mouseDown) {
    // Faster speeds slow down more quickly
    const speedDecay = 0.998 - Math.abs(parms.swirlSpeed) * 0.005;
    parms.swirlSpeed *= speedDecay;
  }
  
  // Wobble effect at high speeds
  if (Math.abs(parms.swirlSpeed) > 0.5) {
    const wobble = Math.sin(Date.now() * 0.01) * Math.abs(parms.swirlSpeed) * 0.02;
    parms.sizeMod = 0.2 + wobble;
  }
  
  // Return to defaults after long inactivity
  const timeSinceInteraction = Date.now() - desktopState.lastInteraction;
  if (timeSinceInteraction > 10000 && !desktopState.mouseDown) {
    const returnSpeed = 0.005;
    
    // Very slow return to defaults
    parms.swirlSpeed *= 0.995;
    parms.hueSpeed += (defaultParms.hueSpeed - parms.hueSpeed) * returnSpeed;
    
    // Don't auto-adjust pattern unless completely stopped
    if (Math.abs(parms.swirlSpeed) < 0.01) {
      parms.circles = Math.round(parms.circles + (defaultParms.circles - parms.circles) * returnSpeed);
      parms.slices = Math.round(parms.slices + (defaultParms.slices - parms.slices) * returnSpeed);
      parms.baseRadius += (defaultParms.baseRadius - parms.baseRadius) * returnSpeed;
      parms.sizeMod += (defaultParms.sizeMod - parms.sizeMod) * returnSpeed;
    }
  }
}