import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('Shadow view exists and includes key actions', () => {
  const exists = fs.existsSync('src/views/Shadow.vue')
  assert.equal(exists, true)

  const content = fs.readFileSync('src/views/Shadow.vue', 'utf8')
  assert.equal(content.includes('上一句'), true)
  assert.equal(content.includes('下一句'), true)
  assert.equal(content.includes('已掌握'), true)
})
