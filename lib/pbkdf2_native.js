/**
 * Native PBKDF2 SHA512 Polyfill for React Native
 * Replaces @ton/crypto-primitives/dist/native/pbkdf2_sha512.js
 * Uses our JS PBKDF2 implementation to avoid null native module issues
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const { Buffer } = require('buffer');
const pbkdf2Shim = require('./pbkdf2');

// Utility functions
const logInfo = (...args) => {
  try {
    console.log('[pbkdf2-native]', ...args);
  } catch {}
};

const logError = (...args) => {
  try {
    console.error('[pbkdf2-native]', ...args);
  } catch {}
};

/**
 * PBKDF2 SHA512 implementation
 */
async function pbkdf2_sha512(key, salt, iterations, keyLen) {
  try {
    const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'utf-8') : key;
    const saltBuffer = typeof salt === 'string' ? Buffer.from(salt, 'utf-8') : salt;
    
    // Support both named and default export shapes
    const shim = (pbkdf2Shim && typeof pbkdf2Shim.derive === 'function')
      ? pbkdf2Shim
      : (pbkdf2Shim && pbkdf2Shim.default && typeof pbkdf2Shim.default.derive === 'function')
        ? pbkdf2Shim.default
        : null;
    
    if (!shim) {
      throw new Error('PBKDF2 shim not available');
    }
    
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
    
    const out = await shim.derive(keyBuffer, saltBuffer, optimizedIterations, keyLen, 'sha-512');
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

module.exports = { pbkdf2_sha512 };