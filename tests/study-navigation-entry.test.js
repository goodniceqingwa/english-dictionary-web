import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('Study page includes previous/next controls', () => {
  const content = fs.readFileSync('src/views/Study.vue', 'utf8')
  assert.equal(content.includes('上一个单词'), true)
  assert.equal(content.includes('下一个单词'), true)
  assert.equal(content.includes('学习会话面板'), true)
  assert.equal(content.includes('本次学习记录'), true)
  assert.equal(content.includes('推荐词进度'), true)
  assert.equal(content.includes('已学词'), true)
  assert.equal(content.includes('返回 AI 教练'), true)
})
