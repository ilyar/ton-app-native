/**
 * React Native wrapper for @ton/crypto-primitives
 * - Reuses browser build for RNG/HMAC/SHA
 * - Overrides PBKDF2 with our JS shim (@noble/hashes) for RN/Expo compatibility
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const { Buffer } = require('buffer');

// Utility functions
const logInfo = (...args) => {
  try {
    console.log('[ton-crypto-primitives-rn]', ...args);
  } catch {}
};

const logError = (...args) => {
  try {
    console.error('[ton-crypto-primitives-rn]', ...args);
  } catch {}
};

// Load browser build (uses getRandomValues which we polyfill in RN)
let browserPrimitives;
try {
  browserPrimitives = require('@ton/crypto-primitives/dist/browser.js');
  logInfo('Browser primitives loaded successfully');
} catch (e) {
  logError('Failed to load browser primitives:', e?.message || 'unknown');
  throw e;
}

// Load our PBKDF2 shim
let pbkdf2Shim;
try {
  const pbkdf2ShimModule = require('./pbkdf2');
  pbkdf2Shim = (pbkdf2ShimModule && typeof pbkdf2ShimModule.derive === 'function')
    ? pbkdf2ShimModule
    : (pbkdf2ShimModule && pbkdf2ShimModule.default && typeof pbkdf2ShimModule.default.derive === 'function')
      ? pbkdf2ShimModule.default
      : null;
  
  if (!pbkdf2Shim) {
    throw new Error('PBKDF2 shim not available');
  }
  
  logInfo('PBKDF2 shim loaded successfully');
} catch (e) {
  logError('Failed to load PBKDF2 shim:', e?.message || 'unknown');
  throw e;
}

/**
 * PBKDF2 SHA512 implementation using our shim
 */
async function pbkdf2_sha512(key, salt, iterations, keyLen) {
  try {
    const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'utf-8') : key;
    const saltBuffer = typeof salt === 'string' ? Buffer.from(salt, 'utf-8') : salt;
    
    // Optimize iterations for development mode
    const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
    const optimizedIterations = isDevelopment && iterations > 1000 ? 1000 : iterations;
    
    logInfo('Starting PBKDF2 SHA512', {
      keyLen: keyBuffer.length,
      saltLen: saltBuffer.length,
      iterations: optimizedIterations,
      originalIterations: iterations,
      keyLen,
      isDevelopment,
    });
    
    const out = await pbkdf2Shim.derive(keyBuffer, saltBuffer, optimizedIterations >>> 0, keyLen >>> 0, 'sha-512');
    const result = Buffer.from(out);
    
    logInfo('PBKDF2 SHA512 completed', { 
      resultLen: result.length,
      iterations: optimizedIterations,
      originalIterations: iterations
    });
    return result;
  } catch (e) {
    logError('PBKDF2 SHA512 failed:', e?.message || 'unknown');
    throw e;
  }
}

// Export everything from browser build with our PBKDF2 override
module.exports = {
  // Re-export everything from browser build
  ...browserPrimitives,
  // Override PBKDF2 with RN-safe implementation
  pbkdf2_sha512,
};