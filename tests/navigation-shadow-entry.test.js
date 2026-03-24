import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('home and app include /shadow entry', () => {
  const home = fs.readFileSync('src/views/Home.vue', 'utf8')
  const app = fs.readFileSync('src/App.vue', 'utf8')
  assert.equal(home.includes('to="/shadow"'), true)
  assert.equal(app.includes('to="/shadow"'), true)
})
