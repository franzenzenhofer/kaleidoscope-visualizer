// Animation loop module
export class AnimationLoop {
  constructor(renderCallback) {
    this.renderCallback = renderCallback;
    this.isRunning = false;
    this.animationId = null;
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.animate();
  }
  
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  animate = (timestamp) => {
    if (!this.isRunning) return;
    
    // Convert timestamp to seconds
    const time = timestamp * 0.001;
    
    // Call the render callback
    this.renderCallback(time);
    
    // Schedule next frame
    this.animationId = requestAnimationFrame(this.animate);
  }
  
  pause() {
    this.stop();
  }
  
  resume() {
    this.start();
  }
}