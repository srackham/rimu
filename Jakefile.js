/*
 * Jakefile for Rimu Markup (http://github.com/srackham/rimu).
 */
'use strict'

let pkg = require('./package.json')
let shelljs = require('shelljs')
let child_process = require('child_process')


/* Inputs and outputs */

let RIMU_LIB = 'bin/rimu.js'
let RIMU_LIB_MIN = 'bin/rimu.min.js'
let RIMU_SRC = shelljs.ls('src/rimu/*.ts')
let RIMU_TSD = 'typings/rimu.d.ts'
let TESTS = shelljs.ls('tests/*.js')
let GH_PAGES_DIR = 'gh-pages/'
let RIMUC = 'bin/rimuc.js'
let RIMUC_TS = 'src/rimuc/rimuc.ts'

let DOCS = [
  {
    src: 'README.md', dst: 'doc/index.html', title: 'Rimu Markup',
    rimucOptions: '--toc'
  },
  {
    src: 'CHANGELOG.md', dst: 'doc/CHANGELOG.html', title: 'Rimu Change Log',
    rimucOptions: '--toc'
  },
  {
    src: 'doc/reference.rmu', dst: 'doc/reference.html', title: 'Rimu Reference',
    rimucOptions: '--toc --highlightjs --prepend "{generate-examples}=\'yes\'"'
  },
  {
    src: 'doc/tips.rmu', dst: 'doc/tips.html', title: 'Rimu Tips',
    rimucOptions: '--toc --highlightjs --mathjax --prepend "{generate-examples}=\'yes\'"'
  },
  {
    src: 'doc/rimuplayground.rmu', dst: 'doc/rimuplayground.html', title: 'Rimu Playground',
    rimucOptions: '--toc --prepend "{generate-examples}=\'yes\'"'
  }
]
let HTML = DOCS.map(doc => doc.dst)


/* Utility functions. */

/*
 Execute shell commands in parallel then run the `callback` when they have all finished.
 Abort if an error occurs.
 Write command output to the inherited stdout (unless the Jake --quiet option is set).
 Print a status message when each command starts and finishes (unless the Jake --quiet option is set).

 NOTE: This function is similar to the built-in jake.exec function but is twice as fast.
 */
function exec(commands, callback) {
  if (typeof commands === 'string') {
    commands = [commands]
  }
  let remaining = commands.length
  if (remaining === 0) {
    callback()
  }
  else {
    commands.forEach(command => {
      jake.logger.log('Starting: ' + command)
      child_process.exec(command, function(error, stdout, stderr) {
        if (!jake.program.opts.quiet) {
          process.stdout.write(stdout)
        }
        if (error !== null) {
          fail(error, error.code)
        }
        jake.logger.log('Finished: ' + command)
        remaining--
        if (remaining === 0) {
          callback()
        }
      })
    })
  }
}


/*
 Tasks

 All tasks are synchronous (another task will not run until the current task has completed).
 Consequently all task dependencies are executed asynchronously in declaration order.
 The `exec` function ensures shell commands within each task run in parallel.
 */

desc(`Run tests.`)
task('default', ['test'])

desc(`build, lint and test rimu and tools, build gh-pages, validate HTML. Use vers=x.y.z argument to set a new version number.`)
task('build', ['test', 'lint', 'version', 'build-gh-pages'])

desc(`Update version number, tag and push to Github and npm. Use vers=x.y.z argument to set a new version number. Finally, rebuild and publish docs website.`)
task('release', ['build', 'tag', 'publish', 'release-gh-pages'])

desc(`Lint TypeScript, Javascript and JSON files.`)
task('lint', {async: true}, function() {
  let commands = []
    .concat(RIMU_SRC.concat([RIMUC_TS, RIMU_TSD]).map(file => 'tslint ' + file))
    .concat(TESTS.map(file => 'jshint ' + file))
    .concat(['jsonlint --quiet package.json'])
  exec(commands, complete)
})

desc(`Run tests (rebuild if necessary).`)
task('test', ['build-rimu', 'build-rimuc'], {async: true}, function() {
  let commands = TESTS.map(file => 'tape ' + file + ' | faucet')
  exec(commands, complete)
})

desc(`Compile and bundle Rimu to (unminified) JavaScript library.`)
task('build-rimu', [RIMU_LIB])

file(RIMU_LIB, RIMU_SRC, {async: true}, function() {
  exec('webpack -d', complete)
})

desc(`Compile and bundle Rimu to minified JavaScript library.`)
task('build-rimu-min', [RIMU_LIB_MIN])

file(RIMU_LIB_MIN, RIMU_SRC.concat('./package.json'), {async: true}, function() {
  exec('webpack --optimize-minimize --output-filename ' + RIMU_LIB_MIN, function() {
    // Prepend package name and version comment to minified library file.
    `/* ${pkg.name} ${pkg.version} (${pkg.repository.url}) */\n${shelljs.cat(RIMU_LIB_MIN)}`
      .to(RIMU_LIB_MIN)
    complete()
  })
})

desc(`Compile rimuc to JavaScript executable.`)
task('build-rimuc', {async: true}, function() {
  shelljs.cp('-f', RIMU_TSD, 'src/rimuc/')  // Kludge: Because there is no way to redirect module references.
  exec(`tsc --project src/rimuc`, function() {
    `#!/usr/bin/env node\n${shelljs.cat(RIMUC)}`.to(RIMUC) // Prepend Shebang line.
    shelljs.chmod('+x', RIMUC)
    complete()
  })
})

desc(`Generate HTML documentation`)
task('html-docs', ['build-rimu-min'], {async: true}, function() {
  let commands = DOCS.map(doc =>
    'node ' + RIMUC +
    ' --styled --lint --no-rimurc' +
    ' --output "' + doc.dst + '"' +
    ' --title "' + doc.title + '"' +
    ' ' + doc.rimucOptions + ' ' +
    ' ./src/examples/example-rimurc.rmu ./doc/doc-header.rmu ' + doc.src
  )
  exec(commands, complete)
})

desc(`Validate HTML documents.`)
task('validate-html', {async: true}, function() {
  let commands = HTML.map(file => 'nu-html-checker ' + file)
  exec(commands, complete)
})

desc(`Display or update the project version number. Use vers=x.y.z argument to set a new version number.`)
task('version', {async: true}, function() {
  let version = process.env.vers
  if (!version) {
    console.log(`version: ${pkg.version}`)
    complete()
  }
  else {
    if (!version.match(/^\d+\.\d+\.\d+$/)) {
      fail('Invalid version number: ' + version + '\n')
    }
    shelljs.sed('-i', /(\s*"version"\s*:\s*)"\d+\.\d+\.\d+"/, `$1"${version}"`, 'package.json')
    pkg.version = version
    exec('git commit -m "Bump version number." package.json', complete)
  }
})

desc(`Create tag ${pkg.version}`)
task('tag', ['test'], {async: true}, function() {
  exec('git tag -a -m "Tag ' + pkg.version + '" ' + pkg.version, complete)
})

desc(`Commit changes to local Git repo.`)
task('commit', ['test'], {async: true}, function() {
  jake.exec('git commit -a', {interactive: true}, complete)
})

desc(`Push to Github and publish to npm.`)
task('publish', ['push', 'publish-npm'])

desc(`Push local commits to Github.`)
task('push', ['test'], {async: true}, function() {
  exec('git push -u --tags origin master', complete)
})

desc(`Publish to npm.`)
task('publish-npm', {async: true}, ['test', 'build-rimu-min'], function() {
  exec('npm publish', complete)
})

desc(`Rebuild and validate documentation then commit and publish to GitHub Pages`)
task('release-gh-pages', ['build-gh-pages', 'commit-gh-pages', 'push-gh-pages'])

desc(`Generate documentation and copy to local gh-pages repo`)
task('build-gh-pages', ['build-rimu-min', 'html-docs', 'validate-html'], function() {
  shelljs.cp('-f', HTML.concat(RIMU_LIB_MIN), GH_PAGES_DIR)
})

desc(`Commit changes to local gh-pages repo. Use msg='commit message' to set a custom commit message.`)
task('commit-gh-pages', ['test'], {async: true}, function() {
  let msg = process.env.msg
  if (!msg) {
    msg = 'rebuilt project website'
  }
  shelljs.cd(GH_PAGES_DIR)
  exec('git commit -a -m "' + msg + '"', function() {
    shelljs.cd('..')
    complete()
  })
})

desc(`Push gh-pages commits to Github.`)
task('push-gh-pages', ['test'], {async: true}, function() {
  shelljs.cd(GH_PAGES_DIR)
  exec('git push origin gh-pages', function() {
    shelljs.cd('..')
    complete()
  })
})
