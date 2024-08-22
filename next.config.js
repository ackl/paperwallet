const path = require('path');

module.exports = {
  webpack: (config) => {
    config.resolve.fallback = {
      "postcss": require.resolve("postcss"),
    };
    return config;
  },
};
