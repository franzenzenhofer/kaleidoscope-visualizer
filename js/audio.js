// Audio analysis module for microphone input and audio file visualization
export class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.musicSource = null;
    this.dataArray = null;
    this.bufferLength = null;
    this.isActive = false;
    this.isMicrophoneMode = false;
    this.isMusicMode = false;
    
    // Audio elements
    this.musicPlayer = null;
    
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
  
  // Initialize audio context and analyzer
  async initAudioContext() {
    if (this.audioContext) return true;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.95;
      
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);
      
      return true;
    } catch (error) {
      console.error('Failed to create audio context:', error);
      return false;
    }
  }
  
  // Start microphone input with improved mobile support
  async startMicrophone() {
    try {
      if (!await this.initAudioContext()) return false;
      
      // Stop any existing sources
      this.stopAllSources();
      
      // Check if we have microphone permission
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' });
          if (permission.state === 'denied') {
            alert('Microphone access denied. Please enable it in your browser settings and try again.');
            return false;
          }
        } catch (e) {
          // Permissions API not supported, continue with getUserMedia
          console.log('Permissions API not supported, continuing...');
        }
      }
      
      // Request microphone access with mobile-optimized constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Mobile-specific optimizations
          sampleRate: 44100,
          channelCount: 1
        }
      };
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        // Fallback for older browsers or stricter mobile policies
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true,
            video: false 
          });
        } catch (fallbackError) {
          console.error('Microphone access failed:', fallbackError);
          
          // Provide user-friendly error messages
          if (fallbackError.name === 'NotAllowedError') {
            alert('🎤 Microphone access denied. Please:\n\n1. Refresh the page\n2. Click "Allow" when prompted\n3. Check your browser settings if needed');
          } else if (fallbackError.name === 'NotFoundError') {
            alert('🎤 No microphone found. Please check your device has a working microphone.');
          } else if (fallbackError.name === 'NotReadableError') {
            alert('🎤 Microphone is busy or not available. Please close other apps using the microphone and try again.');
          } else {
            alert('🎤 Could not access microphone. Please check your device settings and try again.');
          }
          return false;
        }
      }
      
      // Create audio source and connect
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);
      
      // Store the stream for cleanup
      this.microphoneStream = stream;
      
      this.isMicrophoneMode = true;
      this.isMusicMode = false;
      this.isActive = true;
      this.lastUpdateTime = performance.now();
      this.analyze();
      
      return true;
    } catch (error) {
      console.error('Failed to access microphone:', error);
      alert('🎤 Microphone setup failed. Please refresh the page and try again.');
      return false;
    }
  }
  
  // Start music file playback with retry logic
  async startMusic() {
    try {
      if (!await this.initAudioContext()) return false;
      
      // Stop any existing sources
      this.stopAllSources();
      
      // Get music player element
      this.musicPlayer = document.getElementById('musicPlayer');
      if (!this.musicPlayer) {
        console.error('Music player element not found');
        return false;
      }
      
      // Resume audio context if suspended (required for user interaction)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Implement retry logic for audio loading
      const maxRetries = 5;
      const retryDelays = [100, 500, 1000, 2000, 3000]; // Progressive delays
      let lastError = null;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Force reload the audio source
          if (attempt > 0) {
            console.log(`🎵 Retry attempt ${attempt}/${maxRetries} to load audio...`);
            this.musicPlayer.load(); // Force reload
            
            // Wait before retry
            if (attempt < retryDelays.length) {
              await new Promise(resolve => setTimeout(resolve, retryDelays[attempt - 1]));
            }
          }
          
          // Check if audio is ready
          if (this.musicPlayer.readyState < 2) { // HAVE_CURRENT_DATA
            // Try to load the audio
            await new Promise((resolve, reject) => {
              const loadTimeout = setTimeout(() => {
                reject(new Error('Audio load timeout'));
              }, 5000); // 5 second timeout per attempt
              
              const handleCanPlay = () => {
                clearTimeout(loadTimeout);
                cleanup();
                resolve();
              };
              
              const handleError = (e) => {
                clearTimeout(loadTimeout);
                cleanup();
                reject(e);
              };
              
              const cleanup = () => {
                this.musicPlayer.removeEventListener('canplay', handleCanPlay);
                this.musicPlayer.removeEventListener('error', handleError);
              };
              
              this.musicPlayer.addEventListener('canplay', handleCanPlay, { once: true });
              this.musicPlayer.addEventListener('error', handleError, { once: true });
              
              // Trigger load
              this.musicPlayer.load();
            });
          }
          
          // Create media element source only once
          if (!this.musicSource) {
            this.musicSource = this.audioContext.createMediaElementSource(this.musicPlayer);
            this.musicSource.connect(this.analyser);
            this.musicSource.connect(this.audioContext.destination);
          }
          
          // Ensure looping is enabled
          this.musicPlayer.loop = true;
          
          // Add event listeners to ensure continuous playback
          this.musicPlayer.addEventListener('ended', () => {
            if (this.isMusicMode) {
              this.musicPlayer.play();
            }
          });
          
          // Try to start playback
          await this.musicPlayer.play();
          
          // Success! Audio loaded and playing
          console.log('🎵 Audio loaded successfully');
          this.isMusicMode = true;
          this.isMicrophoneMode = false;
          this.isActive = true;
          this.lastUpdateTime = performance.now();
          this.analyze();
          
          return true;
          
        } catch (error) {
          lastError = error;
          console.warn(`Audio load attempt ${attempt + 1} failed:`, error.message);
          
          // Clean up failed attempt
          if (this.musicSource) {
            this.musicSource.disconnect();
            this.musicSource = null;
          }
        }
      }
      
      // All retries failed - but don't show overlay, just continue without audio
      console.error('🎵 Audio loading failed after all retries:', lastError);
      console.log('🎨 Continuing without audio - visualizer will work with user interactions only');
      
      return false;
    } catch (error) {
      console.error('Failed to start music playback:', error);
      return false;
    }
  }
  
  // Stop all audio sources
  stopAllSources() {
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    // Properly close microphone stream to release camera/mic access
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
    }
    
    if (this.musicSource) {
      this.musicSource.disconnect();
      this.musicSource = null;
    }
    
    if (this.musicPlayer && !this.musicPlayer.paused) {
      this.musicPlayer.pause();
    }
    
    this.isMicrophoneMode = false;
    this.isMusicMode = false;
  }
  
  // Stop audio analysis completely
  stop() {
    this.stopAllSources();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isActive = false;
  }
  
  // Pause/resume music
  toggleMusic() {
    if (!this.musicPlayer) return false;
    
    try {
      if (this.musicPlayer.paused) {
        this.musicPlayer.play();
        return true; // Playing
      } else {
        this.musicPlayer.pause();
        return false; // Paused
      }
    } catch (error) {
      console.error('Failed to toggle music:', error);
      return null;
    }
  }
  
  // Check if music is playing
  isMusicPlaying() {
    return this.musicPlayer && !this.musicPlayer.paused;
  }
  
  analyze() {
    if (!this.isActive) return; // Stop RAF loop when not active
    
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
    
    // Continue analyzing only if still active
    if (this.isActive) {
      requestAnimationFrame(() => this.analyze());
    }
  }
  
  // Get frequency data for custom visualization
  getFrequencyData() {
    if (!this.isActive || !this.dataArray) return null;
    return this.dataArray;
  }
  
  // Get FFT data for ribbons visualization
  getFFTData() {
    if (!this.isActive || !this.dataArray) return null;
    // Return a copy to prevent external modifications
    return new Uint8Array(this.dataArray);
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
      isActive: this.isActive,
      isMicrophoneMode: this.isMicrophoneMode,
      isMusicMode: this.isMusicMode,
      isMusicPlaying: this.isMusicPlaying()
    };
  }
}