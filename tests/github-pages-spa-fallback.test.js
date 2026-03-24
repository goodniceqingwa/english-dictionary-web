import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('build script generates GitHub Pages SPA fallback 404.html', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  assert.equal(pkg.scripts.build.includes('dist/404.html'), true)
})
