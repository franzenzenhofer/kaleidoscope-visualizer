// Audio-visual mapping module - bass-focused, relaxing experience
import { parms } from './config.js';

export class AudioVisualMapper {
  constructor(audioAnalyzer) {
    this.audio = audioAnalyzer;
    this.isActive = false;
    
    // Bass-focused configuration for contraction/expansion effect
    this.config = {
      // Bass is the main driver - contraction to center effect
      bassToPulse: 1.0,      // Strong bass pulses for contraction
      bassToRotation: 0.05,   // Very minimal rotation
      bassToSize: 1.5,        // Very strong size response
      
      // Minimal mid/treble influence
      midToSlices: 0.01,      // Almost no complexity changes
      trebleToHue: 0.05,      // Minimal color shifts
      
      // Beat detection - strong contraction pulses
      beatImpact: 0.45,       // Strong beat response
      beatDecay: 0.96,        // Quick decay for punchy effect
      
      // Ultra-smooth transitions - much higher smoothing values
      rotationSmoothing: 0.995,  // Increased from 0.99
      sizeSmoothing: 0.96,       // Increased from 0.92
      hueSmoothing: 0.998,       // Increased from 0.995
      parameterSmoothing: 0.98,  // New: general parameter smoothing
      
      // Interaction blending - USER DOMINANCE when interacting
      userInteractionWeight: 0.9,  // 90% user input, 10% audio when interacting
      audioOnlyWeight: 1.0,        // 100% audio when no user interaction
      userFullControlWeight: 1.0,  // 100% user when audio is disabled
      
      // Limits for controlled contraction
      maxRotationSpeed: 0.15,
      maxSizeVariation: 0.6,  // Allow strong contraction
      maxHueSpeed: 10
    };
    
    // State tracking with ultra-heavy smoothing
    this.beatPulse = 0;
    this.beatPhase = 0;
    this.smoothedValues = {
      bass: 0,
      rotation: 0,
      size: 0,
      hue: 0,
      breathing: 0,
      volume: 0
    };
    
    // Target values for smooth interpolation
    this.targetValues = {
      swirlSpeed: 0,
      sizeMod: 0,
      baseRadius: 0,
      circles: 0,
      hueSpeed: 0,
      slices: 0
    };
    
    // Current interpolated values
    this.currentValues = { ...this.targetValues };
    
    // User interaction tracking
    this.userInteraction = {
      isActive: false,
      lastInteractionTime: 0,
      userValues: { ...this.targetValues },
      interactionDecay: 0.98,  // How quickly user interaction fades
      interactionThreshold: 1500  // Reduced from 2000ms - faster handoff to audio
    };
    
    // Base values to return to
    this.baseValues = { ...parms };
    
    // Interpolation helpers
    this.lastUpdateTime = performance.now();
  }
  
  // Smooth interpolation function with easing
  lerp(current, target, factor, deltaTime = 1) {
    // Apply time-based smoothing for consistent transitions regardless of framerate
    const adjustedFactor = 1 - Math.pow(1 - factor, deltaTime * 60 / 1000);
    return current + (target - current) * adjustedFactor;
  }
  
  // Ease function for smoother transitions
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  // Called by interaction system when user is actively interacting
  onUserInteraction(paramName, value) {
    this.userInteraction.isActive = true;
    this.userInteraction.lastInteractionTime = performance.now();
    
    // Store user's intended values
    if (this.userInteraction.userValues.hasOwnProperty(paramName)) {
      this.userInteraction.userValues[paramName] = value;
    }
  }
  
  // Update user interaction state
  updateUserInteraction() {
    const currentTime = performance.now();
    const timeSinceInteraction = currentTime - this.userInteraction.lastInteractionTime;
    
    // Check if user interaction has expired
    if (timeSinceInteraction > this.userInteraction.interactionThreshold) {
      this.userInteraction.isActive = false;
    }
    
    // USER DOMINANT: Gradually decay user interaction influence but keep it high
    if (this.userInteraction.isActive) {
      return Math.max(0.5, 1 - (timeSinceInteraction / this.userInteraction.interactionThreshold));
    }
    
    return 0;
  }
  
  start() {
    this.isActive = true;
    // Store current values as base
    this.baseValues = { ...parms };
    // Initialize target values
    Object.keys(this.targetValues).forEach(key => {
      this.targetValues[key] = parms[key];
      this.currentValues[key] = parms[key];
      this.userInteraction.userValues[key] = parms[key];
    });
    this.lastUpdateTime = performance.now();
  }
  
  stop() {
    this.isActive = false;
    // When audio is disabled, user gets 100% control immediately
    this.userInteraction.isActive = false;
    // Don't return to base - keep current user values
  }
  
  update() {
    // If audio is not active, user has 100% control - don't interfere
    if (!this.isActive || !this.audio.isActive) {
      return;
    }
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;
    
    const metrics = this.audio.getMetrics();
    
    // Update user interaction state
    const userInfluence = this.updateUserInteraction();
    
    // Ultra-smooth value tracking with time-based interpolation
    this.smoothedValues.bass = this.lerp(this.smoothedValues.bass, metrics.bass, 0.08, deltaTime);
    this.smoothedValues.volume = this.lerp(this.smoothedValues.volume, metrics.volume, 0.06, deltaTime);
    
    // Smooth beat pulse handling
    if (metrics.beat && metrics.bass > 0.4) {
      this.beatPulse = Math.max(this.beatPulse, this.config.beatImpact);
      this.beatPhase = 0;
    }
    
    // Ultra-smooth beat pulse decay  
    this.beatPulse = this.lerp(this.beatPulse, 0, 0.04, deltaTime);
    this.beatPhase += 0.08 * (deltaTime / 16.67); // Normalize for 60fps
    
    // Create ultra-smooth breathing rhythm from bass
    const bassBreathing = this.smoothedValues.bass * this.config.bassToPulse;
    const beatWave = this.beatPulse * Math.sin(this.beatPhase * Math.PI) * 0.8;
    
    // Ultra-smooth rotation calculation
    const targetRotation = this.smoothedValues.bass * this.config.bassToRotation;
    this.smoothedValues.rotation = this.lerp(
      this.smoothedValues.rotation, 
      targetRotation, 
      1 - this.config.rotationSmoothing, 
      deltaTime
    );
    
    // Ultra-smooth size breathing with multiple smoothing layers
    const targetSize = bassBreathing + beatWave;
    this.smoothedValues.size = this.lerp(
      this.smoothedValues.size, 
      targetSize, 
      1 - this.config.sizeSmoothing, 
      deltaTime
    );
    
    // Multiple smoothing layers for ultra-fluid transitions
    this.smoothedValues.breathing = this.lerp(
      this.smoothedValues.breathing, 
      this.smoothedValues.size, 
      0.05, 
      deltaTime
    );
    
    // Ultra-smooth hue transitions
    const targetHue = metrics.treble * this.config.trebleToHue * 10;
    this.smoothedValues.hue = this.lerp(
      this.smoothedValues.hue, 
      targetHue, 
      1 - this.config.hueSmoothing, 
      deltaTime
    );
    
    // Calculate audio-driven target parameter values
    const audioTargets = {
      swirlSpeed: this.baseValues.swirlSpeed + 
                  Math.max(-this.config.maxRotationSpeed, 
                           Math.min(this.config.maxRotationSpeed, this.smoothedValues.rotation)),
      sizeMod: 0,
      baseRadius: 0,
      circles: this.baseValues.circles,
      hueSpeed: Math.max(5, Math.min(this.config.maxHueSpeed, 
                        this.baseValues.hueSpeed + this.smoothedValues.hue)),
      slices: this.baseValues.slices
    };
    
    // Smooth size calculations with easing
    const sizeModulation = Math.min(this.config.maxSizeVariation, this.smoothedValues.breathing);
    const contractionPhase = Math.sin(this.beatPhase * Math.PI * 0.5);
    const easedContraction = this.easeInOutCubic(contractionPhase);
    const smoothContraction = 1 - (sizeModulation * 0.4 * (1 - easedContraction));
    
    audioTargets.sizeMod = Math.max(0.05, Math.min(0.35, 
      this.baseValues.sizeMod * smoothContraction));
    
    audioTargets.baseRadius = Math.max(0.15, Math.min(0.5,
      this.baseValues.baseRadius * (smoothContraction * 0.8)));
    
    // Smooth circle count changes
    if (this.smoothedValues.bass > 0.5) {
      audioTargets.circles = Math.max(3, this.baseValues.circles - Math.floor(this.smoothedValues.bass * 2));
    }
    
    // Ultra-smooth slice changes - much more gradual
    if (metrics.beat && Math.random() > 0.98) { // Even rarer changes
      const variation = Math.random() > 0.5 ? 1 : -1;
      audioTargets.slices = Math.max(4, Math.min(12, this.baseValues.slices + variation));
    }
    
    // USER DOMINANT BLENDING: Blend user interaction with audio targets
    Object.keys(this.targetValues).forEach(key => {
      if (userInfluence > 0) {
        // USER DOMINATES: 90% user input when interacting
        this.targetValues[key] = this.lerp(
          audioTargets[key], 
          this.userInteraction.userValues[key], 
          this.config.userInteractionWeight, // 90% user dominance
          deltaTime
        );
      } else {
        // Pure audio mode when no user interaction
        this.targetValues[key] = audioTargets[key];
      }
      
      // Apply ultra-smooth interpolation to final values
      this.currentValues[key] = this.lerp(
        this.currentValues[key], 
        this.targetValues[key], 
        1 - this.config.parameterSmoothing, 
        deltaTime
      );
      
      // Apply the smoothed values to the actual parameters ONLY if audio is active
      if (this.isActive && this.audio.isActive) {
        parms[key] = this.currentValues[key];
      }
    });
  }
  
  returnToBase() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;
    
    // Ultra-smooth return to base values
    Object.keys(this.baseValues).forEach(key => {
      if (typeof parms[key] === 'number') {
        this.currentValues[key] = this.lerp(this.currentValues[key], this.baseValues[key], 0.02, deltaTime);
        parms[key] = this.currentValues[key];
      }
    });
    
    // If we're close enough to base values, stop smoothly
    const isNearBase = Object.keys(this.baseValues).every(key => {
      if (typeof parms[key] === 'number') {
        return Math.abs(parms[key] - this.baseValues[key]) < 0.01;
      }
      return true;
    });
    
    if (!isNearBase && !this.isActive) {
      requestAnimationFrame(() => this.returnToBase());
    }
  }
  
  // Special effects with ultra-smooth transitions
  applySpecialEffects(metrics) {
    // Only apply effects if audio is active and no strong user interaction
    if (!this.isActive || !this.audio.isActive) return;
    
    const userInfluence = this.updateUserInteraction();
    if (userInfluence > 0.7) return; // Don't interfere with strong user control
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    
    // Deep bass = extra smooth contraction to center
    if (this.smoothedValues.bass > 0.7) {
      const bassPower = (this.smoothedValues.bass - 0.7) * 2;
      const contractionFactor = this.lerp(0, bassPower * 0.2, 0.05, deltaTime);
      
      this.targetValues.baseRadius = Math.max(0.1, this.baseValues.baseRadius * (1 - contractionFactor));
      this.targetValues.sizeMod = Math.max(0.05, this.baseValues.sizeMod * (1 - contractionFactor * 0.75));
    }
    
    // Silence = gentle, smooth expansion back to normal
    if (this.smoothedValues.volume < 0.1) {
      const breath = Math.sin(Date.now() * 0.001) * 0.02 + 1;
      const smoothBreath = this.lerp(1, breath, 0.03, deltaTime);
      
      this.targetValues.sizeMod = Math.min(0.35, this.baseValues.sizeMod * smoothBreath);
      this.targetValues.baseRadius = Math.min(0.5, this.baseValues.baseRadius * smoothBreath);
      this.targetValues.swirlSpeed = this.baseValues.swirlSpeed * 0.3;
    }
    
    // Ensure we never exceed screen bounds
    const maxRadius = Math.min(window.innerWidth, window.innerHeight) * 0.0008;
    this.targetValues.baseRadius = Math.min(this.targetValues.baseRadius, maxRadius);
    
    // Ultra-smooth rotation on medium bass
    if (this.smoothedValues.bass > 0.3 && this.smoothedValues.bass < 0.7) {
      const rotationBoost = this.smoothedValues.bass * 0.05;
      this.targetValues.swirlSpeed = this.lerp(
        this.targetValues.swirlSpeed, 
        this.targetValues.swirlSpeed + rotationBoost, 
        0.02, 
        deltaTime
      );
    }
  }
}