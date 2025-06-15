import { parms, defaultParms } from './config.js';

let audioVisual = null; // Store reference to audio-visual mapper

// Helper function to notify audio visual of user interaction
function notifyUserInteraction(paramName, value) {
  if (audioVisual && audioVisual.onUserInteraction) {
    audioVisual.onUserInteraction(paramName, value);
  }
}

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

// Desktop-specific physics for smoother interactions
const desktopPhysics = {
  mouseX: 0,
  mouseY: 0,
  targetMouseX: 0,
  targetMouseY: 0,
  smoothing: 0.15,
  wheelAccumulator: 0,
  wheelDecay: 0.95,
  lastWheelTime: 0,
  hoverEffect: 0,
  hoverDecay: 0.98
};

export function setupDesktopInteractions(canvas, audioVisualMapper = null) {
  audioVisual = audioVisualMapper;
  
  // Enhanced mouse movement with smoothing
  canvas.addEventListener('mousemove', (e) => {
    desktopPhysics.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    desktopPhysics.targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    
    // Add subtle hover effect
    desktopPhysics.hoverEffect = Math.min(1, desktopPhysics.hoverEffect + 0.1);
  });
  
  canvas.addEventListener('mouseleave', () => {
    // Gradually return to center when mouse leaves
    desktopPhysics.targetMouseX = 0;
    desktopPhysics.targetMouseY = 0;
    desktopPhysics.hoverEffect = 0;
  });
  
  // Mouse wheel for precise control
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const currentTime = Date.now();
    const timeDelta = currentTime - desktopPhysics.lastWheelTime;
    desktopPhysics.lastWheelTime = currentTime;
    
    // Accumulate wheel delta for smooth scrolling
    desktopPhysics.wheelAccumulator += e.deltaY * 0.001;
    
    // Different behaviors based on modifier keys
    if (e.shiftKey) {
      // Shift + wheel = change circle count
      const newCircles = Math.max(3, Math.min(15, Math.round(parms.circles - e.deltaY * 0.01)));
      parms.circles = newCircles;
      notifyUserInteraction('circles', newCircles);
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd + wheel = change size
      const newSizeMod = Math.max(0.05, Math.min(0.5, parms.sizeMod - e.deltaY * 0.0005));
      parms.sizeMod = newSizeMod;
      notifyUserInteraction('sizeMod', newSizeMod);
    } else if (e.altKey) {
      // Alt + wheel = change hue speed
      const newHueSpeed = Math.max(5, Math.min(150, parms.hueSpeed - e.deltaY * 0.1));
      parms.hueSpeed = newHueSpeed;
      notifyUserInteraction('hueSpeed', newHueSpeed);
    } else {
      // Default wheel = change slice count
      const newSlices = Math.max(4, Math.min(32, Math.round(parms.slices - e.deltaY * 0.02)));
      parms.slices = newSlices;
      notifyUserInteraction('slices', newSlices);
    }
  }, { passive: false });
  
  // Click for random variations
  canvas.addEventListener('click', (e) => {
    // Click location affects the type of randomization
    const clickX = e.clientX / window.innerWidth;
    const clickY = e.clientY / window.innerHeight;
    
    if (clickX < 0.5 && clickY < 0.5) {
      // Top-left: Randomize structure
      const newSlices = Math.floor(Math.random() * 16) + 6;
      const newCircles = Math.floor(Math.random() * 8) + 4;
      parms.slices = newSlices;
      parms.circles = newCircles;
      notifyUserInteraction('slices', newSlices);
      notifyUserInteraction('circles', newCircles);
    } else if (clickX >= 0.5 && clickY < 0.5) {
      // Top-right: Randomize motion
      const newSwirlSpeed = (Math.random() - 0.5) * 0.8;
      const newHueSpeed = Math.random() * 80 + 20;
      parms.swirlSpeed = newSwirlSpeed;
      parms.hueSpeed = newHueSpeed;
      notifyUserInteraction('swirlSpeed', newSwirlSpeed);
      notifyUserInteraction('hueSpeed', newHueSpeed);
    } else if (clickX < 0.5 && clickY >= 0.5) {
      // Bottom-left: Randomize size
      const newSizeMod = Math.random() * 0.3 + 0.1;
      const newBaseRadius = Math.random() * 0.3 + 0.2;
      parms.sizeMod = newSizeMod;
      parms.baseRadius = newBaseRadius;
      notifyUserInteraction('sizeMod', newSizeMod);
      notifyUserInteraction('baseRadius', newBaseRadius);
    } else {
      // Bottom-right: Full randomization
      const newSlices = Math.floor(Math.random() * 24) + 4;
      const newCircles = Math.floor(Math.random() * 10) + 3;
      const newSwirlSpeed = (Math.random() - 0.5) * 1.0;
      const newHueSpeed = Math.random() * 100 + 10;
      const newSizeMod = Math.random() * 0.4 + 0.1;
      
      parms.slices = newSlices;
      parms.circles = newCircles;
      parms.swirlSpeed = newSwirlSpeed;
      parms.hueSpeed = newHueSpeed;
      parms.sizeMod = newSizeMod;
      
      notifyUserInteraction('slices', newSlices);
      notifyUserInteraction('circles', newCircles);
      notifyUserInteraction('swirlSpeed', newSwirlSpeed);
      notifyUserInteraction('hueSpeed', newHueSpeed);
      notifyUserInteraction('sizeMod', newSizeMod);
    }
  });
  
  // Keyboard shortcuts for power users
  document.addEventListener('keydown', (e) => {
    // Only handle if canvas is focused or no input is focused
    if (document.activeElement === canvas || document.activeElement === document.body) {
      switch(e.key.toLowerCase()) {
        case 'r':
          // Reset to defaults
          Object.assign(parms, {
            slices: 8,
            circles: 6,
            swirlSpeed: 0.05,
            hueSpeed: 40,
            sizeMod: 0.2,
            baseRadius: 0.25
          });
          notifyUserInteraction('slices', parms.slices);
          notifyUserInteraction('circles', parms.circles);
          notifyUserInteraction('swirlSpeed', parms.swirlSpeed);
          break;
        case ' ':
          // Spacebar = pause/resume rotation
          e.preventDefault();
          const newSwirlSpeed = Math.abs(parms.swirlSpeed) < 0.01 ? 0.15 : 0;
          parms.swirlSpeed = newSwirlSpeed;
          notifyUserInteraction('swirlSpeed', newSwirlSpeed);
          break;
        case 'arrowup':
          e.preventDefault();
          const newSlicesUp = Math.min(32, parms.slices + 1);
          parms.slices = newSlicesUp;
          notifyUserInteraction('slices', newSlicesUp);
          break;
        case 'arrowdown':
          e.preventDefault();
          const newSlicesDown = Math.max(4, parms.slices - 1);
          parms.slices = newSlicesDown;
          notifyUserInteraction('slices', newSlicesDown);
          break;
        case 'arrowright':
          e.preventDefault();
          const newCirclesUp = Math.min(15, parms.circles + 1);
          parms.circles = newCirclesUp;
          notifyUserInteraction('circles', newCirclesUp);
          break;
        case 'arrowleft':
          e.preventDefault();
          const newCirclesDown = Math.max(3, parms.circles - 1);
          parms.circles = newCirclesDown;
          notifyUserInteraction('circles', newCirclesDown);
          break;
      }
    }
  });
}

// Update desktop physics
export function updateDesktopPhysics() {
  // Smooth mouse tracking
  desktopPhysics.mouseX += (desktopPhysics.targetMouseX - desktopPhysics.mouseX) * desktopPhysics.smoothing;
  desktopPhysics.mouseY += (desktopPhysics.targetMouseY - desktopPhysics.mouseY) * desktopPhysics.smoothing;
  
  // Apply mouse influence to rotation
  const mouseInfluence = desktopPhysics.mouseX * 0.3;
  const newSwirlSpeed = parms.swirlSpeed + mouseInfluence * 0.02;
  parms.swirlSpeed = newSwirlSpeed;
  notifyUserInteraction('swirlSpeed', newSwirlSpeed);
  
  // Vertical mouse affects complexity subtly
  const complexityInfluence = Math.abs(desktopPhysics.mouseY) * 0.5;
  if (complexityInfluence > 0.1) {
    const targetSlices = 8 + Math.floor(complexityInfluence * 8);
    const newSlices = Math.max(4, Math.min(20, targetSlices));
    parms.slices = newSlices;
    notifyUserInteraction('slices', newSlices);
  }
  
  // Apply wheel accumulator
  if (Math.abs(desktopPhysics.wheelAccumulator) > 0.001) {
    const newSwirlSpeed2 = parms.swirlSpeed + desktopPhysics.wheelAccumulator * 0.1;
    parms.swirlSpeed = newSwirlSpeed2;
    notifyUserInteraction('swirlSpeed', newSwirlSpeed2);
    
    desktopPhysics.wheelAccumulator *= desktopPhysics.wheelDecay;
  }
  
  // Hover effect
  if (desktopPhysics.hoverEffect > 0.01) {
    const pulse = Math.sin(Date.now() * 0.005) * desktopPhysics.hoverEffect * 0.02;
    const newSizeMod = Math.max(0.05, Math.min(0.5, parms.sizeMod + pulse));
    parms.sizeMod = newSizeMod;
    notifyUserInteraction('sizeMod', newSizeMod);
    
    desktopPhysics.hoverEffect *= desktopPhysics.hoverDecay;
  }
}