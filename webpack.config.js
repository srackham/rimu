module.exports = {
  entry: './out/main.js',
  output: {
    path: __dirname,
    filename: './bin/rimu.js',
    library: 'Rimu',
    libraryTarget: 'commonjs2',
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style!css' }
    ]
  }
};
