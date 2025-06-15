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

// Get UI elements
const playBtn = document.getElementById('playBtn');
const audioBtn = document.getElementById('audioBtn');
const audioLevel = document.getElementById('audioLevel');
const playIcon = playBtn.querySelector('.play-icon');
const pauseIcon = playBtn.querySelector('.pause-icon');

// Helper function to update button states
function updateButtonStates() {
  const metrics = audioAnalyzer.getMetrics();
  
  // Update play button
  if (metrics.isMusicPlaying) {
    playBtn.classList.add('playing');
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
  } else {
    playBtn.classList.remove('playing');
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
  }
  
  // Update microphone button
  if (metrics.isMicrophoneMode) {
    audioBtn.classList.add('active');
  } else {
    audioBtn.classList.remove('active');
  }
  
  // Update audio level visibility
  if (metrics.isActive) {
    audioLevel.classList.add('visible');
  } else {
    audioLevel.classList.remove('visible');
  }
}

// Play button event handler
playBtn.addEventListener('click', async () => {
  const metrics = audioAnalyzer.getMetrics();
  
  if (!metrics.isMusicMode) {
    // Start music mode
    const success = await audioAnalyzer.startMusic();
    
    if (success) {
      audioVisual.start();
      updateButtonStates();
    } else {
      alert('Could not start music playback. Please check if the audio file is available.');
    }
  } else {
    // Toggle play/pause
    const isPlaying = audioAnalyzer.toggleMusic();
    
    if (isPlaying === null) {
      alert('Could not control music playback.');
    } else {
      updateButtonStates();
    }
  }
});

// Microphone button event handler
audioBtn.addEventListener('click', async () => {
  const metrics = audioAnalyzer.getMetrics();
  
  if (!metrics.isMicrophoneMode) {
    // Start microphone mode
    const success = await audioAnalyzer.startMicrophone();
    
    if (success) {
      audioVisual.start();
      updateButtonStates();
    } else {
      alert('Could not access microphone. Please check permissions.');
    }
  } else {
    // Stop microphone
    audioAnalyzer.stop();
    audioVisual.stop();
    updateButtonStates();
  }
});

// Update button states periodically
setInterval(updateButtonStates, 100);

// Handle music player events
const musicPlayer = document.getElementById('musicPlayer');
if (musicPlayer) {
  musicPlayer.addEventListener('ended', () => {
    updateButtonStates();
  });
  
  musicPlayer.addEventListener('pause', () => {
    updateButtonStates();
  });
  
  musicPlayer.addEventListener('play', () => {
    updateButtonStates();
  });
}

