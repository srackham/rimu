// Build rimu.js, rimu.min.js modules and their source .map files.

const path = require('path')
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: {
    'rimu': path.resolve(__dirname, 'rimu.ts'),
    'rimu.min': path.resolve(__dirname, 'rimu.ts'),
  },
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, '../../lib'),
    filename: '[name].js',
    library: 'Rimu',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.ts']
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        sourceMap: true,
        include: /\.min\.js$/,
      }),
    ],
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
    ],
  }
};
