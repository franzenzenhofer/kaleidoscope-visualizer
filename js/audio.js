// Audio analysis module for microphone input and visualization
export class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.dataArray = null;
    this.bufferLength = null;
    this.isActive = false;
    
    // Audio metrics
    this.volume = 0;
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.peak = 0;
    this.beatDetected = false;
    
    // Beat detection - ultra-smooth for relaxed feel
    this.beatThreshold = 0.85;
    this.beatDecay = 0.99;
    this.beatMin = 0.2;
    this.lastBeatTime = 0;
    this.beatInterval = 0;
    
    // Multi-layer smoothing for ultra-fluid transitions
    this.smoothingLayers = {
      // First layer - immediate smoothing
      volumeSmooth1: 0,
      bassSmooth1: 0,
      midSmooth1: 0,
      trebleSmooth1: 0,
      
      // Second layer - deeper smoothing
      volumeSmooth2: 0,
      bassSmooth2: 0,
      midSmooth2: 0,
      trebleSmooth2: 0,
      
      // Third layer - ultra-smooth final values
      volumeFinal: 0,
      bassFinal: 0,
      midFinal: 0,
      trebleFinal: 0
    };
    
    // Time-based smoothing
    this.lastUpdateTime = performance.now();
  }
  
  // Time-based linear interpolation for smooth transitions
  lerp(current, target, factor, deltaTime = 1) {
    const adjustedFactor = 1 - Math.pow(1 - factor, deltaTime * 60 / 1000);
    return current + (target - current) * adjustedFactor;
  }
  
  async start() {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.95; // Even more smoothing for ultra-relaxed response
      
      // Connect microphone to analyser
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);
      
      // Setup data array
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);
      
      this.isActive = true;
      this.lastUpdateTime = performance.now();
      this.analyze();
      
      return true;
    } catch (error) {
      console.error('Failed to access microphone:', error);
      return false;
    }
  }
  
  stop() {
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isActive = false;
  }
  
  analyze() {
    if (!this.isActive) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;
    
    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate frequency bands
    const nyquist = this.audioContext.sampleRate / 2;
    const bassEnd = 250 / nyquist * this.bufferLength;
    const midEnd = 2000 / nyquist * this.bufferLength;
    
    // Calculate averages for each band
    let bassSum = 0, midSum = 0, trebleSum = 0;
    let bassCount = 0, midCount = 0, trebleCount = 0;
    
    for (let i = 0; i < this.bufferLength; i++) {
      const value = this.dataArray[i] / 255;
      
      if (i < bassEnd) {
        bassSum += value;
        bassCount++;
      } else if (i < midEnd) {
        midSum += value;
        midCount++;
      } else {
        trebleSum += value;
        trebleCount++;
      }
    }
    
    // Calculate raw band averages
    const bassRaw = bassCount > 0 ? bassSum / bassCount : 0;
    const midRaw = midCount > 0 ? midSum / midCount : 0;
    const trebleRaw = trebleCount > 0 ? trebleSum / trebleCount : 0;
    
    // Triple-layer smoothing for ultra-fluid results
    // Layer 1: Immediate response smoothing
    this.smoothingLayers.bassSmooth1 = this.lerp(this.smoothingLayers.bassSmooth1, bassRaw, 0.15, deltaTime);
    this.smoothingLayers.midSmooth1 = this.lerp(this.smoothingLayers.midSmooth1, midRaw, 0.12, deltaTime);
    this.smoothingLayers.trebleSmooth1 = this.lerp(this.smoothingLayers.trebleSmooth1, trebleRaw, 0.10, deltaTime);
    
    // Layer 2: Deeper smoothing
    this.smoothingLayers.bassSmooth2 = this.lerp(this.smoothingLayers.bassSmooth2, this.smoothingLayers.bassSmooth1, 0.08, deltaTime);
    this.smoothingLayers.midSmooth2 = this.lerp(this.smoothingLayers.midSmooth2, this.smoothingLayers.midSmooth1, 0.06, deltaTime);
    this.smoothingLayers.trebleSmooth2 = this.lerp(this.smoothingLayers.trebleSmooth2, this.smoothingLayers.trebleSmooth1, 0.05, deltaTime);
    
    // Layer 3: Final ultra-smooth values
    this.smoothingLayers.bassFinal = this.lerp(this.smoothingLayers.bassFinal, this.smoothingLayers.bassSmooth2, 0.04, deltaTime);
    this.smoothingLayers.midFinal = this.lerp(this.smoothingLayers.midFinal, this.smoothingLayers.midSmooth2, 0.03, deltaTime);
    this.smoothingLayers.trebleFinal = this.lerp(this.smoothingLayers.trebleFinal, this.smoothingLayers.trebleSmooth2, 0.02, deltaTime);
    
    // Set final ultra-smooth values
    this.bass = this.smoothingLayers.bassFinal;
    this.mid = this.smoothingLayers.midFinal;
    this.treble = this.smoothingLayers.trebleFinal;
    
    // Calculate overall volume with heavy bass weighting and ultra-smooth transitions
    const volumeRaw = (bassRaw * 3 + midRaw * 0.5 + trebleRaw * 0.2) / 3.7;
    
    // Triple-layer volume smoothing
    this.smoothingLayers.volumeSmooth1 = this.lerp(this.smoothingLayers.volumeSmooth1, volumeRaw, 0.10, deltaTime);
    this.smoothingLayers.volumeSmooth2 = this.lerp(this.smoothingLayers.volumeSmooth2, this.smoothingLayers.volumeSmooth1, 0.06, deltaTime);
    this.smoothingLayers.volumeFinal = this.lerp(this.smoothingLayers.volumeFinal, this.smoothingLayers.volumeSmooth2, 0.03, deltaTime);
    
    this.volume = this.smoothingLayers.volumeFinal;
    
    // Ultra-smooth peak detection for beat
    if (volumeRaw > this.peak) {
      this.peak = this.lerp(this.peak, volumeRaw, 0.3, deltaTime);
    }
    this.peak = this.lerp(this.peak, this.beatMin, 0.01, deltaTime);
    this.peak = Math.max(this.peak, this.beatMin);
    
    // Smoother beat detection with time-based cooldown
    this.beatDetected = false;
    const now = Date.now();
    if (volumeRaw > this.peak * this.beatThreshold && now - this.lastBeatTime > 150) { // Longer cooldown for smoother beats
      this.beatDetected = true;
      this.beatInterval = now - this.lastBeatTime;
      this.lastBeatTime = now;
    }
    
    // Continue analyzing
    requestAnimationFrame(() => this.analyze());
  }
  
  // Get frequency data for custom visualization
  getFrequencyData() {
    if (!this.isActive || !this.dataArray) return null;
    return this.dataArray;
  }
  
  // Get ultra-smooth normalized values (0-1)
  getMetrics() {
    return {
      volume: this.volume,
      bass: this.bass,
      mid: this.mid,
      treble: this.treble,
      beat: this.beatDetected,
      beatInterval: this.beatInterval,
      isActive: this.isActive
    };
  }
}