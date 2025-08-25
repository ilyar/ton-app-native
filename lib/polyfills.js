import { Buffer as BufferPolyfill } from 'buffer';
import 'react-native-get-random-values';

if (typeof globalThis !== 'undefined' && typeof globalThis.Buffer === 'undefined') {
  // @ts-ignore
  globalThis.Buffer = BufferPolyfill;
}
if (typeof global !== 'undefined' && typeof global.Buffer === 'undefined') {
  // @ts-ignore
  global.Buffer = BufferPolyfill;
}

// Ensure Buffer-like behavior for subarray and copy in Hermes/React Native
(() => {
  try {
    const Buf = typeof Buffer !== 'undefined' ? Buffer : BufferPolyfill;

    // Ensure Buffer.prototype.subarray returns a Buffer, not a plain Uint8Array
    if (Buf && typeof Buf.prototype.subarray === 'function') {
      const originalSubarray = Buf.prototype.subarray;
      // Patch only once
      if (!Buf.prototype.__subarrayReturnsBuffer) {
        Object.defineProperty(Buf.prototype, 'subarray', {
          configurable: true,
          writable: true,
          value: function(start, end) {
            const view = originalSubarray.call(this, start, end);
            // Wrap back into Buffer instance so methods like .copy are present
            return Buf.from(view);
          }
        });
        Object.defineProperty(Buf.prototype, '__subarrayReturnsBuffer', {
          value: true
        });
      }
    }

    // Fallback: add .copy to Uint8Array if missing (some polyfills return Uint8Array views)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (typeof Uint8Array !== 'undefined' && typeof Uint8Array.prototype.copy !== 'function') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      Uint8Array.prototype.copy = function(target, targetStart = 0, start = 0, end = this.length) {
        const src = this.subarray(start, end);
        target.set(src, targetStart);
        return src.length;
      };
    }
  } catch {}
})();
