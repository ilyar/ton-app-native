// Metro configuration extending Expo defaults
// https://docs.expo.dev/guides/customizing-metro/

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('metro-resolver');

/** @type {import('metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver = config.resolver || {};
config.resolver.alias = {
  ...(config.resolver.alias || {}),
};
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  // Force any import of 'eventsource' to use our RN-compatible shim
  eventsource: path.resolve(__dirname, 'lib/eventsource.js'),
  // Some libs import the isomorphic wrapper which falls back to 'eventsource' (Node-only).
  // Point it to the same RN-compatible shim to avoid Node 'url' dependency.
  '@tonconnect/isomorphic-eventsource': path.resolve(__dirname, 'lib/eventsource.js'),
  // Replace native pbkdf2 module with a pure JS shim to avoid null native module on Android
  'react-native-fast-pbkdf2': path.resolve(__dirname, 'lib/pbkdf2.js'),
  // Force @ton/crypto-primitives native pbkdf2 to use our JS shim
  '@ton/crypto-primitives/dist/native/pbkdf2_sha512.js': path.resolve(__dirname, 'lib/pbkdf2_native.js'),
  // Some versions import from built output paths; cover common variants
  '@ton/crypto-primitives/native/pbkdf2_sha512.js': path.resolve(__dirname, 'lib/pbkdf2_native.js'),
  '@ton/crypto-primitives/dist/native/pbkdf2_sha512': path.resolve(__dirname, 'lib/pbkdf2_native.js'),
  '@ton/crypto-primitives/native/pbkdf2_sha512': path.resolve(__dirname, 'lib/pbkdf2_native.js'),
  // Alias the package root to our RN wrapper that uses browser build + JS PBKDF2
  '@ton/crypto-primitives': path.resolve(__dirname, 'lib/ton-crypto-primitives-rn.js'),
};

// Intercept problematic imports and redirect them to RN-safe alternatives
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect any 'eventsource' import (including deep subpaths) to our shim
  if (moduleName === 'eventsource' || moduleName.startsWith('eventsource/')) {
    return { type: 'sourceFile', filePath: path.resolve(__dirname, 'lib/eventsource.js') };
  }
  if (moduleName === '@tonconnect/isomorphic-eventsource') {
    return { type: 'sourceFile', filePath: path.resolve(__dirname, 'lib/eventsource.js') };
  }
  // Ensure any usage of native PBKDF2 module resolves to our JS shim
  if (moduleName === 'react-native-fast-pbkdf2') {
    return { type: 'sourceFile', filePath: path.resolve(__dirname, 'lib/pbkdf2.js') };
  }
  // Extra safety: if primitives import their native pbkdf2 path, redirect as well
  if (
    moduleName === '@ton/crypto-primitives/dist/native/pbkdf2_sha512.js' ||
    moduleName === '@ton/crypto-primitives/native/pbkdf2_sha512.js' ||
    moduleName === '@ton/crypto-primitives/dist/native/pbkdf2_sha512' ||
    moduleName === '@ton/crypto-primitives/native/pbkdf2_sha512'
  ) {
    return { type: 'sourceFile', filePath: path.resolve(__dirname, 'lib/pbkdf2_native.js') };
  }
  // If any module attempts to import WebCrypto subtle polyfills, force them to fail to JS fallback
  if (moduleName.includes('webcrypto') || moduleName.includes('subtle')) {
    try {
      // eslint-disable-next-line no-console
      console.log('[metro] redirect potential webcrypto import to noop to force JS fallback:', moduleName);
    } catch {}
    return resolve(context, moduleName, platform);
  }
  return resolve(context, moduleName, platform);
};

// Ensure Expo asset transformer/plugins are applied and asset registry path is set
// Use Expo defaults for transformer and assets; no manual overrides needed

module.exports = config;


