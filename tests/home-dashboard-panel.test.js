import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('Home includes learning path dashboard and daily tasks', () => {
  const content = fs.readFileSync('src/views/Home.vue', 'utf8')
  assert.equal(content.includes('$ welcome --user developer'), true)
  assert.equal(content.includes('学习路径'), true)
  assert.equal(content.includes('今日任务'), true)
})
