import { resize, canvas, setupMobileViewport } from './canvas.js';
import { setupPointerInteraction, setupHammerGestures, updateToyPhysics, setupDeviceMotion } from './interaction.js';
import { setupDesktopInteractions, updateDesktopPhysics } from './desktop-interactions.js';
import { draw } from './renderer.js';
import { enhanceForDesktop, parms } from './config.js';
import { AudioAnalyzer } from './audio.js';
import { AudioVisualMapper } from './audio-visual.js';

// Initialize canvas first
setupMobileViewport();
resize();

// Setup interactions based on device
if ('ontouchstart' in window) {
  // Mobile/tablet with touch
  setupHammerGestures(canvas);
  setupDeviceMotion(); // Enable tilt controls on mobile
} else {
  // Desktop
  enhanceForDesktop();
  setupPointerInteraction();
  setupDesktopInteractions(canvas);
}

// Initialize audio components early
const audioAnalyzer = new AudioAnalyzer();
const audioVisual = new AudioVisualMapper(audioAnalyzer);

// Physics update loop
let lastTime = performance.now();
function updatePhysics() {
  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  
  // Update toy physics for all devices
  updateToyPhysics(deltaTime);
  
  // Update desktop-specific physics
  if (!('ontouchstart' in window)) {
    updateDesktopPhysics();
  }
  
  // Update audio visualization
  updateAudioVisualization();
  
  requestAnimationFrame(updatePhysics);
}

// Update audio visualization in the physics loop
function updateAudioVisualization() {
  if (audioAnalyzer.isActive) {
    // Update visual parameters based on audio
    audioVisual.update();
    
    // Update audio level indicator
    const audioLevel = document.getElementById('audioLevel');
    const audioLevelBar = audioLevel?.querySelector('.bar');
    if (audioLevelBar) {
      const metrics = audioAnalyzer.getMetrics();
      audioLevelBar.style.transform = `scaleX(${metrics.volume})`;
    }
    
    // Apply special effects
    audioVisual.applySpecialEffects(audioAnalyzer.getMetrics());
  }
}

updatePhysics();

// Prevent iOS bounce
document.body.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

// Handle page visibility for performance
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Could pause animation here if needed
  } else {
    // Could resume animation here if needed
  }
});

// Start animation
requestAnimationFrame(draw);

// Setup audio button
const audioBtn = document.getElementById('audioBtn');
const audioLevel = document.getElementById('audioLevel');

audioBtn.addEventListener('click', async () => {
  if (!audioAnalyzer.isActive) {
    // Start audio
    const success = await audioAnalyzer.start();
    
    if (success) {
      audioBtn.classList.add('active');
      audioVisual.start();
      audioLevel.classList.add('visible');
    } else {
      alert('Could not access microphone. Please check permissions.');
    }
  } else {
    // Stop audio
    audioAnalyzer.stop();
    audioVisual.stop();
    
    audioBtn.classList.remove('active');
    audioLevel.classList.remove('visible');
  }
});

