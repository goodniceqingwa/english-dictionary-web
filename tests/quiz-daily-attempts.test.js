import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('StudyQuiz records daily quiz attempts', () => {
  const content = fs.readFileSync('src/views/StudyQuiz.vue', 'utf8')
  assert.equal(content.includes('recordQuizAttempt'), true)
})
