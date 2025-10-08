const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = function override(config, env) {
  // Production optimizations
  if (env === 'production') {
    // Add bundle analyzer in production
    if (process.env.ANALYZE) {
      config.plugins.push(new BundleAnalyzerPlugin({
        analyzerMode: 'server',
        openAnalyzer: true,
      }));
    }

    // Enable source maps for production debugging
    config.devtool = 'source-map';

    // Optimize chunks
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
          },
          recharts: {
            test: /[\\/]node_modules[\\/]recharts[\\/]/,
            name: 'recharts',
            priority: 20,
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
    };
  }

  return config;
};