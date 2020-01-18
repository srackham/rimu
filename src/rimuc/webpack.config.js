// Builds rimuc.js Nodejs executable and rimuc.js.map source map file.

const path = require('path');
const webpack = require('webpack');

module.exports = {
  devtool: 'source-map',
  target: 'node',
  node: {
    // Normal Node.js __dirname and __filename behaviour (https://webpack.js.org/configuration/node/).
    __dirname: false,
    __filename: false,
  },
  entry: path.resolve(__dirname, 'rimuc.ts'),
  externals: {
    'rimu': 'commonjs ../lib/rimu',
  },
  output: {
    path: path.resolve(__dirname, '../../bin'),
    filename: 'rimuc.js',
  },
  resolve: {
    extensions: ['.ts'],
  },
  plugins: [
    new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true }),
  ],
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
      { test: /\/resources\/.*\.(rmu|txt)$/, loader: 'raw-loader' },
    ]
  }
};
