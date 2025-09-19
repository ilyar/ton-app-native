/**
 * React Native Polyfills
 * Provides essential polyfills for React Native/Expo environment
 */

import { Buffer as BufferPolyfill } from 'buffer';
import 'react-native-get-random-values';

// Import EventSource polyfill
import './eventsource';

// Constants
const NETWORK_LOG_RE = /tonapi|ton\.org|bridge/i;
const FETCH_TIMEOUT_MS = 15000;

// Utility functions
const safeNow = () => {
  try {
    return Date.now();
  } catch {
    return 0;
  }
};

const getBodyLength = (body) => {
  try {
    if (!body) return 0;
    if (typeof body === 'string') return body.length;
    if (ArrayBuffer.isView(body)) return body.byteLength;
    if (body instanceof ArrayBuffer) return body.byteLength;
    if (typeof body.size === 'number') return body.size;
    return 0;
  } catch {
    return 0;
  }
};

const logInfo = (...args) => {
  try {
    console.log('[polyfills]', ...args);
  } catch {}
};

/**
 * WebCrypto polyfill configuration
 * Ensures proper fallback to JS implementations in React Native
 */
function configureWebCrypto() {
  try {
    const g = globalThis;
    
    logInfo('Crypto availability check:', {
      hasCrypto: typeof g.crypto !== 'undefined',
      hasSubtle: g.crypto && typeof g.crypto.subtle !== 'undefined',
      hasDeriveBits: g.crypto?.subtle && typeof g.crypto.subtle.deriveBits === 'function',
      hasDeriveKey: g.crypto?.subtle && typeof g.crypto.subtle.deriveKey === 'function',
      platform: typeof Platform !== 'undefined' ? Platform.OS : 'unknown',
    });

    if (g && typeof g.crypto !== 'undefined') {
      const hasWorkingPBKDF2 = g.crypto.subtle && 
        typeof g.crypto.subtle.deriveBits === 'function' &&
        typeof g.crypto.subtle.deriveKey === 'function';
      
      if (!hasWorkingPBKDF2) {
        logInfo('WebCrypto PBKDF2 not available, forcing JS fallback');
        try {
          delete g.crypto.subtle;
        } catch {
          g.crypto.subtle = undefined;
        }
      } else {
        logInfo('WebCrypto PBKDF2 available, keeping native implementation');
      }
    } else {
      logInfo('No crypto object found, will use JS implementations');
    }
  } catch (e) {
    logInfo('Error during crypto setup:', e?.message || 'unknown');
  }
}

/**
 * Enhanced fetch with logging and timeout
 */
function enhanceFetch() {
  try {
    const originalFetch = globalThis.fetch;
    if (typeof originalFetch === 'function' && !globalThis.__FETCH_LOGGER_INSTALLED__) {
      Object.defineProperty(globalThis, '__FETCH_LOGGER_INSTALLED__', { value: true });
      logInfo('Installing fetch logger');
      
      globalThis.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : (input && input.url) ? input.url : String(input);
        const method = (init && init.method) || (typeof input !== 'string' && input && input.method) || 'GET';
        const shouldLog = NETWORK_LOG_RE.test(url);
        const startedAt = safeNow();
        
        if (shouldLog) {
          logInfo(`[fetch] ${method} ${url}`);
        }
        
        let timeoutId;
        let controller;
        
        try {
          // Prefer AbortController when available
          if (typeof AbortController === 'function') {
            controller = new AbortController();
            if (!init) init = {};
            if (!('signal' in init) || !init.signal) {
              init.signal = controller.signal;
            }
            timeoutId = setTimeout(() => { 
              try { 
                controller.abort(); 
              } catch {} 
            }, FETCH_TIMEOUT_MS);
            
            const res = await originalFetch(input, init);
            if (timeoutId) clearTimeout(timeoutId);
            
            if (shouldLog) {
              logInfo(`[fetch] done ${method} ${url} in ${safeNow() - startedAt}ms status=${res.status}`);
            }
            return res;
          }
          
          // Fallback: race with timeout
          const res = await Promise.race([
            originalFetch(input, init),
            new Promise((_, reject) => { 
              timeoutId = setTimeout(() => reject(new Error(`fetch timeout ${FETCH_TIMEOUT_MS}ms`)), FETCH_TIMEOUT_MS); 
            })
          ]);
          
          if (timeoutId) clearTimeout(timeoutId);
          if (shouldLog) {
            logInfo(`[fetch] done ${method} ${url} in ${safeNow() - startedAt}ms status=${res.status}`);
          }
          return res;
        } catch (e) {
          if (timeoutId) clearTimeout(timeoutId);
          if (shouldLog) {
            logInfo(`[fetch] error ${method} ${url} after ${safeNow() - startedAt}ms: ${e && e.message ? e.message : 'unknown'}`);
          }
          throw e;
        }
      };
    }
  } catch (e) {
    logInfo('Error installing fetch logger:', e?.message || 'unknown');
  }
}

/**
 * Enhanced XMLHttpRequest with logging
 */
function enhanceXMLHttpRequest() {
  try {
    const XHR = globalThis.XMLHttpRequest;
    if (!XHR || globalThis.__XHR_LOGGER_INSTALLED__) return;
    
    Object.defineProperty(globalThis, '__XHR_LOGGER_INSTALLED__', { value: true });
    logInfo('Installing XHR logger');
    
    const OriginalXHR = XHR;
    
    function LoggingXHR() {
      const xhr = new OriginalXHR();
      let url = '';
      let method = 'GET';
      
      const shouldLog = () => NETWORK_LOG_RE.test(url);
      const log = (...args) => { 
        try { 
          logInfo('[xhr]', ...args); 
        } catch {} 
      };
      
      const origOpen = xhr.open.bind(xhr);
      xhr.open = function(m, u, ...rest) {
        method = m;
        url = u;
        if (shouldLog()) log('open', method, url);
        return origOpen(m, u, ...rest);
      };
      
      const origSend = xhr.send.bind(xhr);
      xhr.send = function(body) {
        const startedAt = safeNow();
        if (shouldLog()) log('send', method, url, `bodyLen=${getBodyLength(body)}`);
        
        xhr.addEventListener('load', () => {
          if (shouldLog()) log('done', method, url, `status=${xhr.status}`, `in ${safeNow() - startedAt}ms`);
        });
        xhr.addEventListener('error', () => {
          if (shouldLog()) log('error', method, url, `in ${safeNow() - startedAt}ms`);
        });
        xhr.addEventListener('timeout', () => {
          if (shouldLog()) log('timeout', method, url, `in ${safeNow() - startedAt}ms`);
        });
        
        return origSend(body);
      };
      
      return xhr;
    }
    
    // Preserve instanceof semantics and static inheritance
    LoggingXHR.prototype = OriginalXHR.prototype;
    Object.setPrototypeOf(LoggingXHR, OriginalXHR);
    globalThis.XMLHttpRequest = LoggingXHR;
  } catch (e) {
    logInfo('Error installing XHR logger:', e?.message || 'unknown');
  }
}

/**
 * Buffer polyfill setup
 */
function setupBufferPolyfill() {
  if (typeof globalThis !== 'undefined' && typeof globalThis.Buffer === 'undefined') {
    globalThis.Buffer = BufferPolyfill;
  }
  if (typeof global !== 'undefined' && typeof global.Buffer === 'undefined') {
    global.Buffer = BufferPolyfill;
  }
}

/**
 * Buffer behavior enhancements for React Native
 */
function enhanceBufferBehavior() {
  try {
    const Buf = typeof Buffer !== 'undefined' ? Buffer : BufferPolyfill;

    // Ensure Buffer.prototype.subarray returns a Buffer, not a plain Uint8Array
    if (Buf && typeof Buf.prototype.subarray === 'function') {
      const originalSubarray = Buf.prototype.subarray;
      if (!Buf.prototype.__subarrayReturnsBuffer) {
        Object.defineProperty(Buf.prototype, 'subarray', {
          configurable: true,
          writable: true,
          value: function(start, end) {
            const view = originalSubarray.call(this, start, end);
            return Buf.from(view.buffer, view.byteOffset, view.byteLength);
          }
        });
        Object.defineProperty(Buf.prototype, '__subarrayReturnsBuffer', {
          value: true
        });
      }
    }

    // Add .copy to Uint8Array if missing
    if (typeof Uint8Array !== 'undefined' && typeof Uint8Array.prototype.copy !== 'function') {
      Uint8Array.prototype.copy = function(target, targetStart = 0, start = 0, end = this.length) {
        const src = this.subarray(start, end);
        target.set(src, targetStart);
        return src.length;
      };
    }
  } catch (e) {
    logInfo('Error enhancing Buffer behavior:', e?.message || 'unknown');
  }
}

/**
 * Global error handlers
 */
function setupGlobalErrorHandlers() {
  try {
    const log = (...args) => { 
      try { 
        logInfo('[global-error]', ...args); 
      } catch {} 
    };
    
    if (typeof globalThis !== 'undefined') {
      if (!globalThis.__GLOBAL_ERROR_LOGGER__) {
        Object.defineProperty(globalThis, '__GLOBAL_ERROR_LOGGER__', { value: true });
        
        if (typeof globalThis.addEventListener === 'function') {
          try {
            globalThis.addEventListener('unhandledrejection', (evt) => {
              log('unhandledrejection', evt && (evt.reason?.message || evt.reason || 'unknown'));
            });
            globalThis.addEventListener('error', (evt) => {
              log('error', evt && (evt.message || 'unknown'));
            });
          } catch {}
        }
        
        // React Native global hooks
        if (typeof globalThis.addListener === 'function') {
          try {
            globalThis.addListener('unhandledRejection', (reason) => 
              log('unhandledRejection', reason?.message || reason || 'unknown')
            );
          } catch {}
        }
      }
    }
  } catch (e) {
    logInfo('Error setting up global error handlers:', e?.message || 'unknown');
  }
}

/**
 * PBKDF2 self-test
 */
function runPBKDF2SelfTest() {
  try {
    setTimeout(async () => {
      try {
        const m = require('./pbkdf2');
        if (m && typeof m.derive === 'function') {
          const out = await m.derive('test', 'salt', 1, 32);
          logInfo('PBKDF2 self-test ok len=', out && out.length);
        } else {
          logInfo('PBKDF2 shim missing');
        }
      } catch (e) {
        logInfo('PBKDF2 self-test error', e && e.message ? e.message : 'unknown');
      }
    }, 0);
  } catch (e) {
    logInfo('Error setting up PBKDF2 self-test:', e?.message || 'unknown');
  }
}

// Initialize all polyfills
configureWebCrypto();
enhanceFetch();
enhanceXMLHttpRequest();
setupBufferPolyfill();
enhanceBufferBehavior();
setupGlobalErrorHandlers();
runPBKDF2SelfTest();

// Development mode optimization warning
const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
if (isDevelopment) {
  logInfo('🚀 Development mode detected - PBKDF2 iterations optimized for faster development');
}

logInfo('Polyfills initialized successfully');
