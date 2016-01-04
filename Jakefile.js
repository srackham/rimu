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
let SOURCE = shelljs.ls('src/*.ts')
let TESTS = shelljs.ls('tests/*.js')
let GH_PAGES_DIR = './gh-pages/'
let RIMUC = './bin/rimuc.js'

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
    rimucOptions: '--toc --prepend "{generate-examples}=\'yes\'"'
  },
  {
    src: 'doc/tips.rmu', dst: 'doc/tips.html', title: 'Rimu Tips',
    rimucOptions: '--toc --prepend "{generate-examples}=\'yes\'"'
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

desc(`compile, lint, test, build-gh-pages, validate-html.`)
task('build', ['test', 'build-gh-pages', 'validate-html'])

desc(`Update version number, tag and push to Github and npm. Use vers=x.y.z argument to set a new version number. Finally, rebuild and publish docs website.`)
task('release', ['build', 'version', 'tag', 'publish', 'release-gh-pages'])

desc(`Lint TypeScript, Javascript and JSON files.`)
task('lint', {async: true}, function() {
  let commands = []
    .concat(SOURCE.map(file => 'tslint ' + file))
    .concat(TESTS.concat([RIMUC]).map(file => 'jshint ' + file))
    .concat(['jsonlint --quiet package.json'])
  exec(commands, complete)
})

desc(`Run tests (recompile if necessary).`)
task('test', ['compile'], {async: true}, function() {
  let commands = TESTS.map(file => 'tape ' + file + ' | faucet')
  exec(commands, complete)
})

desc(`Compile Typescript to JavaScript then bundle CommonJS and scriptable libraries.`)
task('compile', [RIMU_LIB])

file(RIMU_LIB, SOURCE, {async: true}, function() {
  exec('webpack -d', complete)
})

file(RIMU_LIB_MIN, SOURCE, {async: true}, function() {
  exec('webpack -p --output-filename ' + RIMU_LIB_MIN, function() {
    // Prepend package name and version comment to minified library file.
    `/* ${pkg.name} ${pkg.version} (${pkg.repository.url}) */\n${shelljs.cat(RIMU_LIB_MIN)}`
      .to(RIMU_LIB_MIN)
    complete()
  })
})

desc(`Build rimuc.`)
task('build-rimuc', {async: true}, function() {
    exec(`tsc -p src/rimuc`, function() {
    `#!/usr/bin/env node\n${shelljs.cat(RIMUC)}`.to(RIMUC) // Prepend Shebang line.
    shelljs.chmod('+x', RIMUC)
    complete()
  })
})

desc(`Generate HTML documentation`)
task('html-docs', [RIMU_LIB_MIN], {async: true}, function() {
  let commands = DOCS.map(doc =>
    'node ' + RIMUC +
    ' --styled --lint --no-rimurc' +
    ' --output "' + doc.dst + '"' +
    ' --title "' + doc.title + '"' +
    ' ' + doc.rimucOptions + ' ' +
    ' ./examples/.rimurc ./doc/doc-header.rmu ' + doc.src
  )
  exec(commands, complete)
})

desc(`Validate HTML documents with W3C Validator.`)
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
    shelljs.sed('-i', /(\n\s*"version"\s*:\s*)"\d+\.\d+\.\d+"/, `$1"${version}"`, 'package.json')
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

desc(`push, publish-npm.`)
task('publish', ['push', 'publish-npm'])

desc(`Push local commits to Github.`)
task('push', ['test'], {async: true}, function() {
  exec('git push -u --tags origin master', complete)
})

desc(`Publish to npm.`)
task('publish-npm', {async: true}, ['test', RIMU_LIB_MIN], function() {
  exec('npm publish', complete)
})

desc(`Rebuild and validate documentation then commit and publish to GitHub Pages`)
task('release-gh-pages', ['build-gh-pages', 'commit-gh-pages', 'push-gh-pages'])

desc(`Generate documentation and copy to local gh-pages repo`)
task('build-gh-pages', ['html-docs', 'validate-html'], function() {
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
