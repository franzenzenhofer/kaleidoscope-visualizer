# Dream-Kaleido-Flow v1.5.0 - Mobile Light Toy 2.0

A **tactile light instrument** that transforms touch, motion, and sound into mesmerizing kaleidoscope patterns. Every finger stroke, pinch, or beat sculpts photons on screen with intuitive physics-based controls.

## Playing the Light Toy

### Gesture Controls

| Gesture | Action | Description |
|---------|--------|-------------|
| 🔄 **Single-finger wheel** | Spin speed | Move finger in circles like an iPod wheel |
| 🔍 **Two-finger pinch** | Scale pattern | Pinch to zoom in/out with spring physics |
| 🎨 **Two-finger rotate** | Hue drift | Rotate to shift colors across spectrum |
| ☀️ **3-finger vertical slide** | Brightness | Slide up/down to control luminance (0.3-1.0) |
| 🔄 **Double-tap** | Mode cycle | Switch between Calm → Pulse → Rave modes |
| 📊 **Long press (400ms)** | Debug HUD | Toggle performance stats and parameters |

### Audio Modes

- **Calm**: Pastel colors, gentle breathing, minimal audio response
- **Pulse**: Bass-driven contraction, balanced audio mapping
- **Rave**: High contrast, audio ribbons, maximum reactivity

### Audio Reactivity

- 🎵 **Bass** → Pattern breathing & brightness
- 🎵 **Mids** → Hue drift speed
- 🎵 **Treble** → Slice jitter & detail
- 🎵 **Beat** → Pulse kicks & vibration

## Architecture

The application is organized into the following modules:

### Core Modules

#### `js/config.js`
- Central parameter management with validation
- New params: `luminance` (brightness), `hueDrift` (color shift)
- Desktop/mobile optimization profiles

#### `js/interaction.js` ⭐ NEW
- **Interaction Kernel v2** with spring-based physics
- iPod wheel-style circular motion detection
- Multi-touch gesture recognition (pinch, rotate, 3-finger)
- Inertia and momentum physics
- Mode switching and HUD toggle

#### `js/audio-router.js` ⭐ NEW
- Declarative audio → visual parameter mapping
- Mode-specific routing configurations
- Curve functions (linear, easeExp, easeSqrt)
- Multi-channel signal processing

#### `js/ribbons.js` ⭐ NEW  
- Polar FFT visualization overlay
- 64 frequency bins rendered as radial bars
- Dynamic scaling with pattern zoom
- Mode-specific visual intensity

#### `js/hud.js` ⭐ NEW
- Real-time parameter display
- FPS monitoring
- Audio spectrum analyzer
- Gesture cheat sheet
- Mini FFT visualization

#### `js/renderer.js`
- **Glow & Brightness Channel** without additive blending
- Luminance-modulated gradients (no wash-out)
- Integration with audio ribbons overlay
- HiDPI/Retina optimized rendering

#### Other Core Modules
- `js/canvas.js`: Canvas management and HiDPI support
- `js/audio-visual.js`: Audio analysis and visual mapping
- `js/audio.js`: Microphone/music input processing
- `js/animation.js`: Frame timing and FPS management
- `js/main.js`: Application orchestration

## Technical Specifications

### Performance
- Target: 50+ FPS on iPhone 12 Safari
- Auto-performance adjustment based on frame rate
- DPR cap at 1.5 for mobile battery efficiency
- No additive blending (prevents OLED burn-in)

### Audio Processing
- FFT size: 2048 samples
- Frequency bands: Bass (0-250Hz), Mid (250-2kHz), Treble (2k+)
- Triple-layer smoothing for ultra-fluid transitions
- Beat detection with 150ms cooldown

### Physics Engine
- Spring dynamics: k=0.22, damping=0.88
- Angular momentum with drag coefficient 0.92
- Luminance lerp factor: 0.1
- Touch response: <50ms latency

## Key Features

1. **Full Light Control**: Direct manipulation of brightness, hue, pattern density & spin
2. **Deep Audio Reactivity**: Multi-channel frequency analysis drives visual parameters
3. **Physics-Based Interaction**: Spring dynamics, inertia, and momentum
4. **Zero Brightness Wash**: Calibrated for 1000 nits OLED without additive blending
5. **Mode System**: Calm/Pulse/Rave presets with distinct visual personalities
6. **Debug HUD**: Real-time performance monitoring and parameter display

## Development

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run E2E tests with Playwright
```

## Browser Compatibility

- Chrome/Edge 61+ (recommended)
- Firefox 60+
- Safari 11+ / iOS Safari 14+
- ES6 module support required
- WebAudio API for audio features

## Dependencies

- **Vite**: Build tool and dev server
- **Hammer.js 2.0.8**: Touch gesture recognition
- **Playwright**: E2E testing framework

## Performance Benchmarks

| Device | FPS | Mode | Audio |
|--------|-----|------|-------|
| iPhone 15 Pro | 60 | Rave | ✓ |
| iPhone 12 | 52 | Pulse | ✓ |
| iPad Pro 11" | 60 | Rave | ✓ |
| Pixel 7 | 58 | Rave | ✓ |

## License

MIT License - Feel the light, shape the flow ✨