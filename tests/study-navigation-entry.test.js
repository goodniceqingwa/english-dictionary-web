import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('Study page includes previous/next controls', () => {
  const content = fs.readFileSync('src/views/Study.vue', 'utf8')
  assert.equal(content.includes('上一个单词'), true)
  assert.equal(content.includes('下一个单词'), true)
})
