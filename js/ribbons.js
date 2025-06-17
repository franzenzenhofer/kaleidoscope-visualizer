import { parms } from './config.js';
import { canvas, ctx, w, h, midX, midY } from './canvas.js';

// Audio ribbons module - draws radial FFT bars behind kaleidoscope
export class AudioRibbons {
  constructor(audioAnalyzer) {
    this.audio = audioAnalyzer;
    this.enabled = false;
    
    // Configuration
    this.config = {
      fftBins: 64,              // Number of frequency bins to display
      minRadius: 0.15,          // Inner radius (proportion of canvas size)
      maxRadius: 0.45,          // Outer radius (proportion of canvas size)
      baseHeight: 0.05,         // Minimum bar height
      maxHeight: 0.3,           // Maximum bar height  
      heightPower: 1.3,         // Power curve for frequency response
      smoothing: 0.85,          // Smoothing factor for animations
      colorOffset: 60,          // Hue offset between bars
      baseAlpha: 0.6,           // Base opacity
      glowStrength: 0.8,        // Glow effect strength
      rotationSpeed: 0.2        // Rotation speed multiplier
    };
    
    // State
    this.smoothedHeights = new Float32Array(this.config.fftBins);
    this.rotation = 0;
    this.lastTime = performance.now();
  }
  
  enable() {
    this.enabled = true;
  }
  
  disable() {
    this.enabled = false;
  }
  
  draw(t) {
    if (!this.enabled || !this.audio || !this.audio.isActive) {
      return;
    }
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    // Get FFT data
    const fftData = this.audio.getFFTData();
    if (!fftData || fftData.length === 0) {
      return;
    }
    
    // Update rotation based on swirl speed
    this.rotation += parms.swirlSpeed * this.config.rotationSpeed * deltaTime;
    
    // Save context state
    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(this.rotation);
    
    // Calculate dimensions
    const containerSize = Math.min(w, h);
    const innerRadius = containerSize * this.config.minRadius;
    const outerRadius = containerSize * this.config.maxRadius;
    const radiusRange = outerRadius - innerRadius;
    
    // Process FFT data into bins
    const binsPerBar = Math.floor(fftData.length / this.config.fftBins);
    const angleStep = (Math.PI * 2) / this.config.fftBins;
    
    // Get current luminance and hue drift
    const luminance = parms.luminance || 0.6;
    const hueDrift = parms.hueDrift || 0;
    
    // Draw ribbons
    for (let i = 0; i < this.config.fftBins; i++) {
      // Average FFT values for this bin
      let binValue = 0;
      const startIdx = i * binsPerBar;
      const endIdx = Math.min(startIdx + binsPerBar, fftData.length);
      
      for (let j = startIdx; j < endIdx; j++) {
        binValue += fftData[j];
      }
      binValue = binValue / (endIdx - startIdx) / 255; // Normalize to 0-1
      
      // Apply power curve
      binValue = Math.pow(binValue, this.config.heightPower);
      
      // Smooth the height
      this.smoothedHeights[i] = this.smoothedHeights[i] * this.config.smoothing + 
                                binValue * (1 - this.config.smoothing);
      
      // Calculate bar dimensions
      const angle = i * angleStep;
      const height = this.config.baseHeight + this.smoothedHeights[i] * this.config.maxHeight;
      const barHeight = radiusRange * height;
      
      // Calculate colors with hue drift
      const hue = (t * parms.hueSpeed + i * this.config.colorOffset + hueDrift * 90) % 360;
      const alpha = this.config.baseAlpha * luminance * (0.5 + this.smoothedHeights[i] * 0.5);
      
      // Draw ribbon bar
      ctx.save();
      ctx.rotate(angle);
      
      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(0, innerRadius, 0, innerRadius + barHeight);
      gradient.addColorStop(0, `hsla(${hue}, 100%, ${60 * luminance}%, ${alpha})`);
      gradient.addColorStop(0.5, `hsla(${hue}, 90%, ${50 * luminance}%, ${alpha * 0.8})`);
      gradient.addColorStop(1, `hsla(${hue}, 80%, ${30 * luminance}%, 0)`);
      
      // Draw the bar
      ctx.fillStyle = gradient;
      ctx.fillRect(-angleStep * innerRadius * 0.4, innerRadius, 
                   angleStep * innerRadius * 0.8, barHeight);
      
      // Add glow effect for active bars
      if (this.smoothedHeights[i] > 0.3) {
        ctx.shadowBlur = 20 * this.config.glowStrength;
        ctx.shadowColor = `hsla(${hue}, 100%, ${70 * luminance}%, ${alpha})`;
        ctx.fillRect(-angleStep * innerRadius * 0.3, innerRadius, 
                     angleStep * innerRadius * 0.6, barHeight * 0.8);
        ctx.shadowBlur = 0;
      }
      
      ctx.restore();
    }
    
    ctx.restore();
  }
  
  // Update configuration based on mode
  setMode(mode) {
    switch (mode) {
      case 'Calm':
        this.config.maxHeight = 0.2;
        this.config.baseAlpha = 0.4;
        this.config.glowStrength = 0.5;
        break;
      case 'Pulse':
        this.config.maxHeight = 0.3;
        this.config.baseAlpha = 0.6;
        this.config.glowStrength = 0.8;
        break;
      case 'Rave':
        this.config.maxHeight = 0.4;
        this.config.baseAlpha = 0.8;
        this.config.glowStrength = 1.0;
        this.enable(); // Always show ribbons in rave mode
        break;
    }
  }
}