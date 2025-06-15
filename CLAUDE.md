# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an interactive kaleidoscope visualization web application built with vanilla JavaScript and ES6 modules. It creates animated, symmetrical visual patterns that respond to user interactions through mouse, touch, and keyboard inputs.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run preview      # Preview production build
```

## Architecture

The application follows a modular architecture with clear separation of concerns:

- **config.js**: Central configuration management with parameter validation
- **canvas.js**: Canvas and HiDPI display management
- **renderer.js**: Visual rendering engine for kaleidoscope patterns
- **interaction.js**: User input handling (mouse, touch, keyboard)
- **animation.js**: Animation loop with FPS monitoring and auto-performance adjustment
- **main.js**: Application entry point and module orchestration

## Key Technical Details

1. **No Framework**: Pure vanilla JavaScript with ES6 modules
2. **Build Tool**: Vite for development and production builds
3. **Touch Support**: Uses Hammer.js (v2.0.8) for advanced touch gestures
4. **Browser Requirements**: ES6 module support (Chrome/Edge 61+, Firefox 60+, Safari 11+)
5. **Mobile-First**: Viewport and CSS configured to prevent unwanted mobile gestures

## Interaction System

- Mouse horizontal movement controls swirl speed
- Mouse vertical movement controls slice count
- Touch gestures include pan, pinch, rotate, and double-tap
- Keyboard shortcuts: Arrow keys, Space (pause), R (reset), D (debug), S (settings), F (fullscreen), P (screenshot)

## Recent Changes

The codebase was recently refactored to remove visual changes while keeping gesture controls. The files `physics.js` and `toy-interactions.js` were removed, and `desktop-interactions.js` was added (currently untracked).