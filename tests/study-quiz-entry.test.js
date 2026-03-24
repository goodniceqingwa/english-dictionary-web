import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('Study page includes quiz entry button', () => {
  const content = fs.readFileSync('src/views/Study.vue', 'utf8')
  assert.equal(content.includes('/study/quiz'), true)
})
