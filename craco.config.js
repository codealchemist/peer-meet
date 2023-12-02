require('react-scripts/config/env')

module.exports = () => {
  return {
    webpack: {
      configure: (webpackConfig, { env }) => {
        webpackConfig.stats = {
          builtAt: true
        }

        webpackConfig.resolve = {
          ...webpackConfig.resolve,
          fallback: {
            //path: require.resolve('path-browserify'),
            buffer: require.resolve('buffer')
          }
        }

        return webpackConfig
      }
    }
  }
}
