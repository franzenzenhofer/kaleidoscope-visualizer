// Physics engine for toy-like behavior
export class PhysicsEngine {
  constructor() {
    // Current values
    this.rotation = 0;
    this.rotationVelocity = 0;
    this.scale = 1;
    this.scaleVelocity = 0;
    this.spread = 1;
    this.spreadVelocity = 0;
    this.twist = 0;
    this.twistVelocity = 0;
    
    // Target/rest values
    this.targetRotation = 0;
    this.targetScale = 1;
    this.targetSpread = 1;
    this.targetTwist = 0;
    
    // Physics constants
    this.friction = 0.92;
    this.springStrength = 0.08;
    this.damping = 0.85;
    
    // Interaction state
    this.isInteracting = false;
    this.lastInteractionTime = Date.now();
  }
  
  // Apply spring physics to return to rest
  applySpringForce(current, target, velocity, strength = this.springStrength) {
    const force = (target - current) * strength;
    return velocity + force;
  }
  
  // Update physics simulation
  update() {
    const now = Date.now();
    const timeSinceInteraction = now - this.lastInteractionTime;
    
    // Start returning to defaults after 2 seconds
    const returnStrength = Math.min(timeSinceInteraction / 2000, 1) * this.springStrength;
    
    if (!this.isInteracting) {
      // Apply spring forces to return to rest
      this.rotationVelocity = this.applySpringForce(this.rotation, this.targetRotation, this.rotationVelocity, returnStrength);
      this.scaleVelocity = this.applySpringForce(this.scale, this.targetScale, this.scaleVelocity, returnStrength);
      this.spreadVelocity = this.applySpringForce(this.spread, this.targetSpread, this.spreadVelocity, returnStrength);
      this.twistVelocity = this.applySpringForce(this.twist, this.targetTwist, this.twistVelocity, returnStrength);
      
      // Apply friction
      this.rotationVelocity *= this.friction;
      this.scaleVelocity *= this.friction;
      this.spreadVelocity *= this.friction;
      this.twistVelocity *= this.friction;
      
      // Update positions
      this.rotation += this.rotationVelocity;
      this.scale += this.scaleVelocity;
      this.spread += this.spreadVelocity;
      this.twist += this.twistVelocity;
      
      // Clamp values
      this.scale = Math.max(0.3, Math.min(3, this.scale));
      this.spread = Math.max(0.5, Math.min(2, this.spread));
      this.twist = Math.max(-Math.PI, Math.min(Math.PI, this.twist));
    }
  }
  
  // Interaction methods
  startInteraction() {
    this.isInteracting = true;
  }
  
  endInteraction() {
    this.isInteracting = false;
    this.lastInteractionTime = Date.now();
  }
  
  // Add impulse (for swipe/flick gestures)
  addRotationImpulse(force) {
    this.rotationVelocity += force;
    this.lastInteractionTime = Date.now();
  }
  
  addScaleImpulse(force) {
    this.scaleVelocity += force;
    this.lastInteractionTime = Date.now();
  }
  
  // Direct manipulation (for drag gestures)
  setRotation(value) {
    this.rotation = value;
    this.lastInteractionTime = Date.now();
  }
  
  setScale(value) {
    this.scale = Math.max(0.3, Math.min(3, value));
    this.lastInteractionTime = Date.now();
  }
  
  setSpread(value) {
    this.spread = Math.max(0.5, Math.min(2, value));
    this.lastInteractionTime = Date.now();
  }
  
  setTwist(value) {
    this.twist = Math.max(-Math.PI, Math.min(Math.PI, value));
    this.lastInteractionTime = Date.now();
  }
}