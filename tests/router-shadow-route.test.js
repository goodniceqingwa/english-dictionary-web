import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('router has Shadow route', () => {
  const content = fs.readFileSync('src/router/index.js', 'utf8')
  assert.equal(content.includes("path: '/shadow'"), true)
})
