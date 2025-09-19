/**
 * PBKDF2 Polyfill for React Native/Expo
 * Provides a drop-in replacement for 'react-native-fast-pbkdf2' using @noble/hashes
 */

/* eslint-disable @typescript-eslint/no-var-requires */

// Utility functions
const logInfo = (...args) => {
  try {
    console.log('[pbkdf2]', ...args);
  } catch {}
};

const logError = (...args) => {
  try {
    console.error('[pbkdf2]', ...args);
  } catch {}
};

// Module state
let nobleHashesAvailable = false;
let pbkdf2Func = null;
let pbkdf2AsyncFunc = null;
let sha512Func = null;

// Initialize @noble/hashes
try {
  const { pbkdf2, pbkdf2Async } = require('@noble/hashes/pbkdf2');
  const { sha512 } = require('@noble/hashes/sha2');
  
  pbkdf2Func = pbkdf2;
  pbkdf2AsyncFunc = pbkdf2Async;
  sha512Func = sha512;
  nobleHashesAvailable = true;
  
  logInfo('@noble/hashes loaded successfully');
} catch (e) {
  logError('Failed to load @noble/hashes:', e?.message || 'unknown');
  nobleHashesAvailable = false;
}

/**
 * Convert input to Uint8Array
 */
function toBytes(input) {
  if (input instanceof Uint8Array) return input;
  if (typeof input === 'string') {
    return Buffer.from(input, 'utf8');
  }
  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }
  throw new TypeError('Unsupported input type for PBKDF2');
}

/**
 * Get hash function by name
 */
function getHash(digest) {
  if (!nobleHashesAvailable) {
    throw new Error('@noble/hashes not available for PBKDF2');
  }
  
  const algo = String(digest || 'sha512').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (algo === 'sha512') return sha512Func;
  
  throw new Error(`Unsupported PBKDF2 digest: ${digest}`);
}

/**
 * Async PBKDF2 derivation
 */
async function derive(password, salt, iterations, keyLength, digest = 'sha512') {
  if (!nobleHashesAvailable) {
    throw new Error('PBKDF2 not available: @noble/hashes failed to load');
  }
  
  const hash = getHash(digest);
  const pwd = toBytes(password);
  const slt = toBytes(salt);
  
  // Optimize iterations for development mode
  const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
  const optimizedIterations = isDevelopment && iterations > 1000 ? 1000 : iterations;
  
  logInfo('Starting PBKDF2 derivation', {
    hash: digest,
    iterations: optimizedIterations,
    originalIterations: iterations,
    keyLength,
    pwdLen: pwd.length,
    saltLen: slt.length,
    isDevelopment,
  });
  
  try {
    // Prefer async when available; otherwise fall back to sync
    if (typeof pbkdf2AsyncFunc === 'function') {
      const out = await pbkdf2AsyncFunc(
        hash,
        pwd,
        slt,
        { c: optimizedIterations >>> 0, dkLen: keyLength >>> 0 }
      );
      logInfo('PBKDF2 derivation completed (async)', { 
        outLen: out.length,
        iterations: optimizedIterations,
        originalIterations: iterations
      });
      return new Uint8Array(out);
    }
    
    if (typeof pbkdf2Func === 'function') {
      const out = pbkdf2Func(
        hash,
        pwd,
        slt,
        { c: optimizedIterations >>> 0, dkLen: keyLength >>> 0 }
      );
      logInfo('PBKDF2 derivation completed (sync)', { 
        outLen: out.length,
        iterations: optimizedIterations,
        originalIterations: iterations
      });
      return new Uint8Array(out);
    }
    
    throw new Error('PBKDF2 functions are not available');
  } catch (e) {
    logError('PBKDF2 derivation failed:', e?.message || 'unknown');
    throw e;
  }
}

/**
 * Sync PBKDF2 derivation
 */
function deriveSync(password, salt, iterations, keyLength, digest = 'sha512') {
  if (!nobleHashesAvailable) {
    throw new Error('PBKDF2 not available: @noble/hashes failed to load');
  }
  
  const hash = getHash(digest);
  const pwd = toBytes(password);
  const slt = toBytes(salt);
  
  // Optimize iterations for development mode
  const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
  const optimizedIterations = isDevelopment && iterations > 1000 ? 1000 : iterations;
  
  logInfo('Starting PBKDF2 sync derivation', {
    hash: digest,
    iterations: optimizedIterations,
    originalIterations: iterations,
    keyLength,
    pwdLen: pwd.length,
    saltLen: slt.length,
    isDevelopment,
  });
  
  try {
    const out = pbkdf2Func(
      hash,
      pwd,
      slt,
      { c: optimizedIterations >>> 0, dkLen: keyLength >>> 0 }
    );
    logInfo('PBKDF2 sync derivation completed', { 
      outLen: out.length,
      iterations: optimizedIterations,
      originalIterations: iterations
    });
    return new Uint8Array(out);
  } catch (e) {
    logError('PBKDF2 sync derivation failed:', e?.message || 'unknown');
    throw e;
  }
}

/**
 * Health check function
 */
function checkHealth() {
  return {
    nobleHashesAvailable,
    hasPbkdf2: !!pbkdf2Func,
    hasPbkdf2Async: !!pbkdf2AsyncFunc,
    hasSha512: !!sha512Func,
    platform: typeof Platform !== 'undefined' ? Platform.OS : 'unknown',
  };
}

module.exports = {
  derive,
  deriveSync,
  checkHealth,
  default: { derive, deriveSync, checkHealth },
};