# Kaleidoscope Visualization

A modular, interactive kaleidoscope visualization built with vanilla JavaScript and ES6 modules.

## Architecture

The application is organized into the following modules:

### `js/config.js`
- **Purpose**: Configuration and parameters management
- **Exports**: 
  - `config` object with all visualization parameters
  - `constraints` for parameter validation
  - Helper functions for parameter updates and normalization
- **Features**:
  - Parameter validation and clamping
  - Normalized value conversions
  - Centralized configuration management

### `js/canvas.js`
- **Purpose**: Canvas management and coordinate systems
- **Exports**: `CanvasManager` class
- **Features**:
  - HiDPI/Retina display support
  - Automatic canvas resizing
  - Coordinate system transformations
  - Canvas state management

### `js/renderer.js`
- **Purpose**: All rendering and drawing operations
- **Exports**: `Renderer` class
- **Features**:
  - Radial gradient generation
  - Motif drawing with symmetry
  - Kaleidoscope slice rendering
  - Debug information display

### `js/interaction.js`
- **Purpose**: User input handling
- **Exports**: `InteractionHandler` class
- **Features**:
  - Mouse/touch interaction
  - Hammer.js integration for gestures
  - Keyboard shortcuts
  - Momentum physics
  - Parameter mapping from user input

### `js/animation.js`
- **Purpose**: Animation loop and timing
- **Exports**: `AnimationLoop` class
- **Features**:
  - FPS calculation and monitoring
  - Performance mode auto-adjustment
  - Timing and delta time management
  - Pause/resume functionality

### `js/main.js`
- **Purpose**: Application entry point and orchestration
- **Features**:
  - Module initialization and coordination
  - UI setup (info display, settings panel)
  - Fullscreen support
  - Screenshot functionality
  - Debug mode

## Controls

### Mouse/Touch
- **Move horizontally**: Adjust swirl speed
- **Move vertically**: Change number of slices
- **Mouse wheel**: Zoom (adjust base radius)

### Keyboard Shortcuts
- **Arrow Keys**: Fine-tune parameters
- **Space**: Pause/resume animation
- **R**: Reset to default parameters
- **D**: Toggle debug mode
- **S**: Toggle settings panel
- **F**: Toggle fullscreen
- **P**: Save screenshot

### Touch Gestures (with Hammer.js)
- **Pan**: Adjust swirl speed and circles
- **Pinch**: Scale the visualization
- **Rotate**: Adjust rotation speed
- **Double tap**: Reset parameters

## Features

1. **Modular Architecture**: Clean separation of concerns with ES6 modules
2. **Performance Optimization**: Auto-adjusts quality based on FPS
3. **Responsive Design**: Adapts to any screen size
4. **HiDPI Support**: Crisp rendering on Retina displays
5. **Interactive Controls**: Multiple input methods for parameter adjustment
6. **Extensible**: Easy to add new features or modify behavior

## Browser Compatibility

- Modern browsers with ES6 module support
- Chrome/Edge 61+
- Firefox 60+
- Safari 11+
- Mobile browsers with touch support

## Dependencies

- **Optional**: Hammer.js for advanced touch gestures (loaded from CDN)

## Usage

Simply open `index.html` in a modern web browser. The visualization will start automatically and respond to user input.