import { parms } from './config.js';
import { canvas, ctx, w, h, dpr, midX, midY } from './canvas.js';
import { updatePhysicsAndAudio } from './main.js';

// Draw one "motif" that will be rotated / mirrored around the center.
function drawMotif(t) {
  const {circles, baseRadius, sizeMod, hueSpeed} = parms;
  
  // FAILSAFE: Ensure we have valid dimensions
  const safeW = w || 100;
  const safeH = h || 100;
  
  // Use the smaller dimension to ensure pattern fits within viewport
  const containerSize = Math.min(safeW, safeH);
  
  // FAILSAFE: Additional validation
  if (!isFinite(containerSize) || containerSize <= 0) {
    console.warn('Invalid containerSize:', containerSize, 'w:', safeW, 'h:', safeH);
    return;
  }
  
  for (let i = 0; i < circles; i++) {
    const angle   = i / circles * Math.PI * 2 + t * 0.7;
    const r       = baseRadius * containerSize + Math.sin(t + i) * 40;
    const x       = Math.cos(angle) * r;
    const y       = Math.sin(angle) * r;
    const size    = (30 + Math.sin(t*1.2 + i*0.7) * 20) * (1 + sizeMod*Math.sin(t*0.3+i));
    const hue     = (t * hueSpeed + i * 50) % 360;

    // FAILSAFE: Comprehensive validation
    if (!isFinite(x) || !isFinite(y) || !isFinite(size) || 
        !isFinite(r) || !isFinite(angle) || !isFinite(hue) ||
        size <= 0 || r < 0) {
      console.warn('Invalid drawing values:', {x, y, size, r, angle, hue});
      continue;
    }

    // CRISP VISUALS: Enhanced gradients and sharper rendering
    const g = ctx.createRadialGradient(x,y,0, x,y,size);
    // More vibrant colors with better contrast
    g.addColorStop(0, `hsla(${hue},100%,70%,1)`); // Full opacity at center
    g.addColorStop(0.3, `hsla(${hue},100%,60%,0.9)`); // Extra color stop for richness
    g.addColorStop(0.7, `hsla(${(hue+120)%360},90%,40%,0.4)`); // Smoother transition
    g.addColorStop(1, `hsla(${(hue+180)%360},80%,20%,0)`); // Softer edge
    
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI*2);
    ctx.fill();
    
    // Add subtle outline for crispness on some circles
    if (i % 2 === 0) {
      ctx.strokeStyle = `hsla(${hue},100%,80%,0.3)`;
      ctx.lineWidth = 0.5 * dpr; // Thin line adjusted for device pixel ratio
      ctx.stroke();
    }
  }
}

// Main animation loop
export function draw(now) {
  const t = now * 0.001; // ms → s

  // Update physics and audio in the same frame
  updatePhysicsAndAudio(now);

  // Ensure canvas dimensions are valid
  if (!w || !h || w <= 0 || h <= 0) {
    requestAnimationFrame(draw);
    return;
  }

  // Clear the entire canvas using logical dimensions
  ctx.clearRect(0, 0, w, h);

  // Paint multiple mirrored slices to build kaleidoscope.
  ctx.save();
  ctx.translate(midX, midY);

  const {slices, swirlSpeed} = parms;
  const sliceAngle = Math.PI * 2 / slices;

  for (let s = 0; s < slices; s++) {
    ctx.save();
    ctx.rotate(sliceAngle * s + t * swirlSpeed);
    // Mirror every second slice for sharper symmetry
    if (s & 1) ctx.scale(-1, 1);
    drawMotif(t);
    ctx.restore();
  }
  ctx.restore();

  requestAnimationFrame(draw);
}