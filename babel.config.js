module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // Expo preset includes react-native babel preset with JSX/TSX support
      'babel-preset-expo',
    ],
    plugins: [
      // Keep reanimated first as recommended
      'react-native-reanimated/plugin',
    ],
  };
};


