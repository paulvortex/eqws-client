module.exports = {
  entry: ['./src/index.js'],
  output: {
    filename: 'dist/eqws-client.js'
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /(node_modules|bower_components)/,
      loader: 'babel',
      query: {
        presets: ['es2015']
      }
    }]
  }
};