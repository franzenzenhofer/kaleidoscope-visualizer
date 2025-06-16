// Version and cache busting
export const VERSION = '1.2.0';
export const BUILD_TIME = '2024-12-27T12:15:00Z';
export const CACHE_BUSTER = `${VERSION}-${Date.now()}`;

// Log version info
console.log(`🎨 Dream-Kaleido-Flow v${VERSION} (${BUILD_TIME})`);
console.log(`🔄 Cache buster: ${CACHE_BUSTER}`); 