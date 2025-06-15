import { parms } from './config.js';
import { canvas, ctx, w, h, dpr, midX, midY } from './canvas.js';

// Draw one "motif" that will be rotated / mirrored around the center.
function drawMotif(t) {
  const {circles, baseRadius, sizeMod, hueSpeed} = parms;
  
  // Use the smaller dimension to ensure pattern fits within viewport
  const containerSize = Math.min(w, h);
  
  for (let i = 0; i < circles; i++) {
    const angle   = i / circles * Math.PI * 2 + t * 0.7;
    const r       = baseRadius * containerSize + Math.sin(t + i) * 40;
    const x       = Math.cos(angle) * r;
    const y       = Math.sin(angle) * r;
    const size    = (30 + Math.sin(t*1.2 + i*0.7) * 20) * (1 + sizeMod*Math.sin(t*0.3+i));
    const hue     = (t * hueSpeed + i * 50) % 360;

    const g = ctx.createRadialGradient(x,y,0, x,y,size);
    g.addColorStop(0, `hsla(${hue},100%,65%,0.95)`);
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