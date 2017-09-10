/*
 * Jakefile for Rimu Markup (http://github.com/srackham/rimu).
 */
'use strict'

if (parseInt(process.versions.node) < 6) {
  fail('nodejs must be version 6 or greater')
}

let pkg = require('./package.json')
let shelljs = require('shelljs')
let child_process = require('child_process')


/* Inputs and outputs */

let RIMU_LIB = 'lib/rimu.js'
let RIMU_LIB_MIN = 'lib/rimu.min.js'
let RIMU_SRC = shelljs.ls('src/rimu/*.ts')
let RIMU_TSD = 'typings/rimu.d.ts'
let TESTS = shelljs.ls('test/*.js')
let GH_PAGES_DIR = 'gh-pages/'
let RIMUC = 'bin/rimuc.js'
let RIMUC_TS = 'src/rimuc/rimuc.ts'

let DOCS = [
  {
    src: 'README.md', dst: 'doc/index.html', title: 'Rimu Markup',
    rimucOptions: '--sidebar-toc'
  },
  {
    src: 'doc/changelog.rmu',
    dst: 'doc/changelog.html',
    title: 'Rimu Change Log',
    rimucOptions: '--sidebar-toc'
  },
  {
    src: 'doc/reference.rmu',
    dst: 'doc/reference.html',
    title: 'Rimu Reference',
    rimucOptions: '--sidebar-toc --highlightjs --prepend "{generate-examples}=\'yes\'"'
  },
  {
    src: 'doc/tips.rmu', dst: 'doc/tips.html', title: 'Rimu Tips',
    rimucOptions: '--sidebar-toc --highlightjs --mathjax --prepend "{generate-examples}=\'yes\'"'
  },
  {
    src: 'doc/rimuplayground.rmu',
    dst: 'doc/rimuplayground.html',
    title: 'Rimu Playground',
    rimucOptions: '--dropdown-toc --prepend "{generate-examples}=\'yes\'"'
  },
  {
    src: 'README.md', dst: 'doc/flex-example.html', title: 'Rimu Markup',
    rimucOptions: '--sidebar-toc --styled-name flex'
  },
  {
    src: 'README.md',
    dst: 'doc/flex-graystone-example.html',
    title: 'Rimu Markup',
    rimucOptions: '--dropdown-toc --styled-name flex --theme graystone'
  }
]
let HTML = DOCS.map(doc => doc.dst)


/* Utility functions. */

/*
 Execute shell commands in parallel then run the `callback` when they have all finished.
 Abort immediately an error occurs unless options.executeAll is true (in which case run all commands
 commands and abort if one or more failed).
 Write command output to the inherited stdout (unless the Jake --quiet option is set).
 Print a status message when each command starts and finishes (unless the Jake --quiet option is set).

 NOTE: This function is similar to the built-in jake.exec function but is twice as fast.
 */
function exec(commands, callback, options = {}) {
  if (typeof commands === 'string') {
    commands = [commands]
  }
  let remaining = commands.length
  if (remaining === 0) {
    callback()
  }
  else {
    let error_count = 0
    commands.forEach(command => {
      jake.logger.log('STARTING: ' + command)
      child_process.exec(command, function (error, stdout, stderr) {
        jake.logger.log((error === null ? 'FINISHED: ' : 'FAILED: ') + command)
        if (!jake.program.opts.quiet) {
          jake.logger.log(stdout)
        }
        if (error !== null) {
          if (options.executeAll) {
            error_count++
          }
          else {
            fail(error, error.code)
          }
        }
        remaining--
        if (remaining === 0) {
          if (error_count > 0) {
            fail(error_count + ' errors(s)')
          }
          else {
            callback()
          }
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
task('lint', {async: true}, function () {
  let commands = []
    .concat(RIMU_SRC.concat([RIMUC_TS, RIMU_TSD]).map(file => 'tslint ' + file))
    .concat(TESTS.map(file => 'jshint ' + file))
    .concat(['jsonlint --quiet package.json'])
  exec(commands, complete)
})

desc(`Run tests (rebuild if necessary).`)
task('test', ['build-rimu', 'build-rimuc'], {async: true}, function () {
  let commands = TESTS.map(file => 'tape ' + file + ' | faucet')
  exec(commands, complete)
})

desc(`Compile and bundle rimu.js and rimu.min.js libraries and generate .map files.`)
task('build-rimu', [RIMU_LIB])

file(RIMU_LIB, RIMU_SRC, {async: true}, function () {
  exec('webpack --config ./src/rimu/webpack.config.js', complete)
})

desc(`Compile rimuc to JavaScript executable and generate .map file.`)
task('build-rimuc', {async: true}, function () {
  exec('webpack --config ./src/rimuc/webpack.config.js', function () {
    shelljs.chmod('+x', RIMUC)
    complete()
  })
})

desc(`Generate HTML documentation`)
task('html-docs', ['build-rimu'], {async: true}, function () {
  let commands = DOCS.map(doc =>
    'node ' + RIMUC +
    ' --styled --lint --no-rimurc --theme default --custom-toc --header-links' +
    ' --styled-name "classic"' +
    ' --output "' + doc.dst + '"' +
    ' --lang "en"' +
    ' --title "' + doc.title + '"' +
    ' ' + doc.rimucOptions + ' ' +
    ' ./src/examples/example-rimurc.rmu ./doc/doc-header.rmu ' + doc.src
  )
  exec(commands, complete)
})

// NOTE: This task has no dependents assumes html-validator npm package is installed.
// It's no longer part of the build process because some of the documentation files
// have style elements in the document body which is not accepted by the HTML5 spec
// even though all browsers accept them.
desc(`Validate HTML documents.`)
task('validate-html', {async: true}, function () {
  let commands = HTML.map(file => 'html-validator --verbose --format=text --file=' + file)
  exec(commands, complete, {executeAll: true})
})

desc(`Display or update the project version number. Use vers=x.y.z argument to set a new version number.`)
task('version', {async: true}, function () {
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
task('tag', ['test'], {async: true}, function () {
  exec('git tag -a -m "Tag ' + pkg.version + '" ' + pkg.version, complete)
})

desc(`Commit changes to local Git repo.`)
task('commit', ['test'], {async: true}, function () {
  jake.exec('git commit -a', {interactive: true}, complete)
})

desc(`Push to Github and publish to npm.`)
task('publish', ['push', 'publish-npm'])

desc(`Push local commits to Github.`)
task('push', ['test'], {async: true}, function () {
  exec('git push -u --tags origin master', complete)
})

desc(`Publish to npm.`)
task('publish-npm', {async: true}, ['test', 'build-rimu'], function () {
  exec('npm publish', complete)
})

desc(`Rebuild and validate documentation then commit and publish to GitHub Pages`)
task('release-gh-pages', ['build-gh-pages', 'commit-gh-pages', 'push-gh-pages'])

desc(`Generate documentation and copy to local gh-pages repo`)
task('build-gh-pages', ['build-rimu', 'html-docs'], function () {
  shelljs.cp('-f', HTML.concat(RIMU_LIB_MIN), GH_PAGES_DIR)
})

desc(`Commit changes to local gh-pages repo. Use msg='commit message' to set a custom commit message.`)
task('commit-gh-pages', ['test'], {async: true}, function () {
  let msg = process.env.msg
  if (!msg) {
    msg = 'rebuilt project website'
  }
  shelljs.cd(GH_PAGES_DIR)
  exec('git commit -a -m "' + msg + '"', function () {
    shelljs.cd('..')
    complete()
  })
})

desc(`Push gh-pages commits to Github.`)
task('push-gh-pages', ['test'], {async: true}, function () {
  shelljs.cd(GH_PAGES_DIR)
  exec('git push origin gh-pages', function () {
    shelljs.cd('..')
    complete()
  })
})
