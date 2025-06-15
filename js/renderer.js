import { parms } from './config.js';
import { canvas, ctx, w, h, dpr, midX, midY } from './canvas.js';
import { physics, updateToyPhysics } from './toy-interactions.js';

// Draw one "motif" that will be rotated / mirrored around the center.
function drawMotif(t) {
  const {circles, baseRadius, sizeMod, hueSpeed, spiralTightness} = parms;
  
  for (let i = 0; i < circles; i++) {
    // Add spiral effect based on physics
    const spiralOffset = i * physics.twist * 0.1;
    const angle = i / circles * Math.PI * 2 + t * 0.7 + spiralOffset;
    
    // Dynamic radius with physics influence
    const baseR = baseRadius * Math.min(w,h) / dpr;
    const waveR = Math.sin(t + i + physics.rotation) * 40 * physics.spread;
    const r = baseR + waveR;
    
    // Position with spiral tightness
    const x = Math.cos(angle) * r * spiralTightness;
    const y = Math.sin(angle) * r * spiralTightness;
    
    // Size with multiple influences
    const sizeWave = 30 + Math.sin(t*1.2 + i*0.7) * 20;
    const sizePulse = 1 + sizeMod * Math.sin(t*0.3 + i);
    const size = sizeWave * sizePulse * physics.scale;
    
    // Dynamic hue with rotation influence
    const hue = (t * hueSpeed + i * 50 + physics.rotation * 30) % 360;
    
    // Create gradient with physics-influenced colors
    const g = ctx.createRadialGradient(x,y,0, x,y,size);
    const innerAlpha = 0.95 - (1 - physics.scale) * 0.3;
    g.addColorStop(0, `hsla(${hue},100%,65%,${innerAlpha})`);
    g.addColorStop(0.5, `hsla(${(hue+90)%360},100%,50%,0.5)`);
    g.addColorStop(1, `hsla(${(hue+180)%360},100%,15%,0)`);
    
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI*2);
    ctx.fill();
  }
}

// Main animation loop
export function draw(now) {
  const t = now * 0.001; // ms → s
  
  // Update physics simulation
  updateToyPhysics();

  // Dynamic background fade based on motion
  const motionBlur = Math.min(0.3, Math.abs(physics.rotationVelocity) * 2 + 0.05);
  ctx.fillStyle = `rgba(0,0,0,${0.15 - motionBlur * 0.1})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Paint multiple mirrored slices to build kaleidoscope.
  ctx.save();
  ctx.translate(midX, midY);
  
  // Apply physics rotation
  ctx.rotate(physics.rotation);

  const {slices, swirlSpeed} = parms;
  const sliceAngle = Math.PI * 2 / slices;

  for (let s = 0; s < slices; s++) {
    ctx.save();
    
    // Dynamic rotation with physics influence
    const sliceRotation = sliceAngle * s + t * swirlSpeed + physics.twist * Math.sin(s);
    ctx.rotate(sliceRotation);
    
    // Mirror every second slice for sharper symmetry
    if (s & 1) {
      ctx.scale(-1, 1);
    }
    
    // Scale based on physics
    ctx.scale(physics.scale, physics.scale);
    
    drawMotif(t);
    ctx.restore();
  }
  ctx.restore();

  requestAnimationFrame(draw);
}