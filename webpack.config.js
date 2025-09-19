// Custom webpack config to augment Expo's defaults for web
// - Alias internal noble import to public subpath to avoid export warnings
// - Keep other defaults intact
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    '@noble/hashes/crypto.js': require.resolve('@noble/hashes/crypto'),
  };

  return config;
};



