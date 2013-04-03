Package.describe({
  summary: 'Readable text to HTML markup'
});

Package.on_use(function (api) {
  api.add_files('./bin/rimu.js', ['client', 'server']);
});
