/**
 * React Native EventSource Polyfill
 * Provides a React Native compatible EventSource implementation using react-native-sse
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const RNEventSourceModule = require('react-native-sse');
const RNEventSource = RNEventSourceModule && RNEventSourceModule.default
  ? RNEventSourceModule.default
  : RNEventSourceModule;

// Utility functions
const logInfo = (...args) => {
  try {
    console.log('[EventSource]', ...args);
  } catch {}
};

/**
 * EventSource wrapper with default headers and logging
 */
class EventSourceWithDefaults {
  constructor(url, options = {}) {
    const defaultHeaders = {
      'User-Agent': 'TonAppNative/1.0 (react-native-sse)',
      Accept: 'text/event-stream',
    };
    
    const merged = {
      ...options,
      headers: { ...(options.headers || {}), ...defaultHeaders },
    };
    
    logInfo(`Creating EventSource for URL: ${url}`);
    
    const es = new RNEventSource(url, merged);
    
    try {
      this.setupEventHandlers(es);
    } catch (e) {
      logInfo('Error setting up event handlers:', e?.message || 'unknown');
    }
    
    return es;
  }
  
  setupEventHandlers(es) {
    // Patch property handlers
    const originalOnOpen = es.onopen;
    const originalOnMessage = es.onmessage;
    const originalOnError = es.onerror;
    
    es.onopen = function(evt) {
      logInfo('Connection opened');
      if (typeof originalOnOpen === 'function') {
        try { 
          originalOnOpen.call(es, evt); 
        } catch (e) {
          logInfo('Error in onopen handler:', e?.message || 'unknown');
        }
      }
    };
    
    es.onmessage = function(evt) {
      try {
        const preview = typeof evt?.data === 'string' ? evt.data.slice(0, 120) : '';
        logInfo('Message received:', preview);
      } catch {}
      
      if (typeof originalOnMessage === 'function') {
        try { 
          originalOnMessage.call(es, evt); 
        } catch (e) {
          logInfo('Error in onmessage handler:', e?.message || 'unknown');
        }
      }
    };
    
    es.onerror = function(evt) {
      logInfo('Connection error:', evt && evt.message ? evt.message : 'unknown');
      if (typeof originalOnError === 'function') {
        try { 
          originalOnError.call(es, evt); 
        } catch (e) {
          logInfo('Error in onerror handler:', e?.message || 'unknown');
        }
      }
    };
    
    // Add event listeners with logging
    if (es.addEventListener) {
      let messageCount = 0;
      
      es.addEventListener('open', () => {
        logInfo('Event: open');
      });
      
      es.addEventListener('message', (evt) => {
        if (messageCount < 3) {
          const preview = typeof evt?.data === 'string' ? evt.data.slice(0, 80) : '';
          logInfo('Event: message', preview);
        }
        messageCount += 1;
      });
      
      es.addEventListener('error', (evt) => {
        logInfo('Event: error', evt && evt.message ? evt.message : 'unknown');
      });
      
      es.addEventListener('close', () => {
        logInfo('Event: close');
      });
    }
  }
}

// Install polyfill if EventSource is not available
if (typeof globalThis !== 'undefined' && !globalThis.EventSource) {
  globalThis.EventSource = EventSourceWithDefaults;
  logInfo('EventSource polyfill installed');
}

module.exports = RNEventSource;