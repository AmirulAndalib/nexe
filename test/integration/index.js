const { mkdtemp, copyFile } = require('fs/promises')
const os = require('os')
const path = require('path')
const rimraf = require('rimraf')
const cp = require('child_process')

async function runTests() {
  const tempdir = await mkdtemp(path.join(os.tmpdir(), 'nexe-integration-tests-'))
  const secondTempdir = await mkdtemp(path.join(os.tmpdir(), 'nexe-integration-tests-without-executable-'))
  const executable = path.join(tempdir, path.basename(process.argv[0]))
  await copyFile(process.argv[0], executable)
  process.on('beforeExit', () => {
    rimraf.sync(tempdir)
    rimraf.sync(secondTempdir)
  })
  console.error('Running integration tests with the binary in the current working directory.')
  spawnExecutable(tempdir, () => {
    console.error('Running integration tests with the binary in another directory.')
    spawnExecutable(secondTempdir)
  })

  function spawnExecutable(cwd, cb) {
    cp.spawn(executable,
      [
      path.join(tempdir, 'node_modules/mocha/bin/mocha.js'),
        path.join(tempdir, 'test/integration/tests.integration-spec.js')
      ],
      { stdio: ['inherit', 'inherit', 'inherit', 'ipc'], cwd }
    ).on('exit', (code) => {
      process.exitCode = process.exitCode || code

      if(cb) cb()
    })
  }
}

runTests()
