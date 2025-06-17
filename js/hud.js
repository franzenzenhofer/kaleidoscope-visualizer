import { parms } from './config.js';
import { physics } from './interaction.js';

export class DebugHUD {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.visible = false;
    this.fps = 0;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.lastFPSUpdate = this.lastTime;
    
    // Audio analyzer reference
    this.audioAnalyzer = null;
    
    // Gesture cheat sheet
    this.gestures = [
      { gesture: 'Single finger wheel', action: 'Spin speed', icon: '🔄' },
      { gesture: 'Two-finger pinch', action: 'Scale pattern', icon: '🔍' },
      { gesture: 'Two-finger rotate', action: 'Hue drift', icon: '🎨' },
      { gesture: '3-finger vertical', action: 'Brightness', icon: '☀️' },
      { gesture: 'Double-tap', action: 'Mode cycle', icon: '🔄' },
      { gesture: 'Long press 400ms', action: 'Toggle HUD', icon: '📊' }
    ];
    
    this.createCanvas();
  }
  
  createCanvas() {
    // Create overlay canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'hud';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1000';
    this.canvas.style.display = 'none';
    document.body.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    
    // Handle resize
    window.addEventListener('resize', () => this.resize());
  }
  
  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
  }
  
  setAudioAnalyzer(analyzer) {
    this.audioAnalyzer = analyzer;
  }
  
  toggle() {
    this.visible = !this.visible;
    this.canvas.style.display = this.visible ? 'block' : 'none';
  }
  
  show() {
    this.visible = true;
    this.canvas.style.display = 'block';
  }
  
  hide() {
    this.visible = false;
    this.canvas.style.display = 'none';
  }
  
  update() {
    if (!this.visible) return;
    
    const currentTime = performance.now();
    this.frameCount++;
    
    // Update FPS every 500ms
    if (currentTime - this.lastFPSUpdate > 500) {
      this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFPSUpdate));
      this.frameCount = 0;
      this.lastFPSUpdate = currentTime;
    }
    
    this.draw();
  }
  
  draw() {
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, w, h);
    
    // Setup text style
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 3;
    
    // Draw FPS
    const fpsText = `FPS: ${this.fps}`;
    ctx.strokeText(fpsText, 10, 20);
    ctx.fillText(fpsText, 10, 20);
    
    // Draw parameter values
    let y = 40;
    const params = [
      { name: 'Mode', value: physics.mode },
      { name: 'Swirl', value: parms.swirlSpeed.toFixed(2) },
      { name: 'Scale', value: physics.scale.toFixed(2) },
      { name: 'Luminance', value: parms.luminance.toFixed(2) },
      { name: 'Hue Drift', value: parms.hueDrift.toFixed(2) },
      { name: 'Base Radius', value: parms.baseRadius.toFixed(2) },
      { name: 'Slices', value: parms.slices },
      { name: 'Circles', value: parms.circles }
    ];
    
    params.forEach(param => {
      const text = `${param.name}: ${param.value}`;
      ctx.strokeText(text, 10, y);
      ctx.fillText(text, 10, y);
      y += 15;
    });
    
    // Draw audio metrics if available
    if (this.audioAnalyzer && this.audioAnalyzer.isActive) {
      const metrics = this.audioAnalyzer.getMetrics();
      y += 10;
      
      ctx.fillStyle = 'rgba(100, 255, 100, 0.9)';
      const audioParams = [
        { name: 'Volume', value: metrics.volume.toFixed(2) },
        { name: 'Bass', value: metrics.bass.toFixed(2) },
        { name: 'Mid', value: metrics.mid.toFixed(2) },
        { name: 'Treble', value: metrics.treble.toFixed(2) },
        { name: 'Beat', value: metrics.beat ? '🎵' : '-' }
      ];
      
      audioParams.forEach(param => {
        const text = `${param.name}: ${param.value}`;
        ctx.strokeText(text, 10, y);
        ctx.fillText(text, 10, y);
        y += 15;
      });
    }
    
    // Draw mini spectrum
    if (this.audioAnalyzer && this.audioAnalyzer.isActive) {
      const fftData = this.audioAnalyzer.getFFTData();
      if (fftData) {
        ctx.save();
        ctx.translate(10, y + 10);
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, 100, 50);
        
        // Spectrum bars
        const barWidth = 100 / 32;
        const step = Math.floor(fftData.length / 32);
        
        ctx.fillStyle = 'rgba(100, 255, 100, 0.8)';
        for (let i = 0; i < 32; i++) {
          const value = fftData[i * step] / 255;
          const barHeight = value * 45;
          ctx.fillRect(i * barWidth, 50 - barHeight, barWidth - 1, barHeight);
        }
        
        ctx.restore();
      }
    }
    
    // Draw gesture cheat sheet on the right
    ctx.save();
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    
    y = 20;
    ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
    const title = 'Gestures:';
    ctx.strokeText(title, w - 10, y);
    ctx.fillText(title, w - 10, y);
    y += 20;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.gestures.forEach(g => {
      const text = `${g.icon} ${g.gesture}: ${g.action}`;
      ctx.strokeText(text, w - 10, y);
      ctx.fillText(text, w - 10, y);
      y += 15;
    });
    
    ctx.restore();
  }
}