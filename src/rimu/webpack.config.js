// Build rimu.js, rimu.min.js modules and their source .map files.

let path = require('path')
let webpack = require('webpack');

module.exports = {
  entry: {
    'rimu': path.resolve(__dirname, 'main.ts'),
    'rimu.min': path.resolve(__dirname, 'main.ts'),
  },
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, '../../lib'),
    filename: '[name].js',
    library: 'Rimu',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['.ts']
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      sourceMap: true,
      include: /\.min\.js$/,
    }),
  ],
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
    ],
  }
};
