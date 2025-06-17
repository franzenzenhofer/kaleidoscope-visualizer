import { parms } from './config.js';
import { canvas, ctx, w, h, dpr, midX, midY } from './canvas.js';
import { updatePhysicsAndAudio } from './main.js';
import { physics } from './interaction.js';

// Module-level variable to store ribbons instance
let audioRibbons = null;

// Set ribbons instance (called from main.js)
export function setAudioRibbons(ribbons) {
  audioRibbons = ribbons;
}

// Draw one "motif" that will be rotated / mirrored around the center.
function drawMotif(t) {
  const {circles, baseRadius, sizeMod, hueSpeed, luminance, hueDrift} = parms;
  
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
    const hue     = (t * hueSpeed + i * 50 + hueDrift * 90) % 360;

    // FAILSAFE: Comprehensive validation
    if (!isFinite(x) || !isFinite(y) || !isFinite(size) || 
        !isFinite(r) || !isFinite(angle) || !isFinite(hue) ||
        size <= 0 || r < 0) {
      console.warn('Invalid drawing values:', {x, y, size, r, angle, hue});
      continue;
    }

    // CRISP VISUALS: Enhanced gradients with luminance control
    const g = ctx.createRadialGradient(x,y,0, x,y,size);
    // Original alpha values restored - only modulate lightness with luminance
    g.addColorStop(0, `hsla(${hue},100%,${70*luminance}%,1)`);
    g.addColorStop(0.3, `hsla(${hue},100%,${60*luminance}%,0.9)`);
    g.addColorStop(0.7, `hsla(${(hue+120)%360},90%,${40*luminance}%,0.4)`);
    g.addColorStop(1, `hsla(${(hue+180)%360},80%,${20*luminance}%,0)`)
    
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI*2);
    ctx.fill();
    
    // Add subtle outline for crispness on some circles
    if (i % 2 === 0) {
      ctx.strokeStyle = `hsla(${hue},100%,${80*luminance}%,0.3)`;
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
  
  // Draw audio ribbons behind kaleidoscope if in Rave mode
  if (audioRibbons && physics.mode === 'Rave') {
    audioRibbons.draw(t);
  }

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