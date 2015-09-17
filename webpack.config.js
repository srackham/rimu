module.exports = {
  entry: './src/main.ts',
  output: {
    path: __dirname,
    filename: './bin/rimu.js',
    library: 'Rimu',
    libraryTarget: 'umd',
    devtoolModuleFilenameTemplate: "webpack:///.[resource-path]",
  },
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style!css' },
      { test: /\.tsx?$/, loader: 'ts-loader' }
    ]
  }
};
