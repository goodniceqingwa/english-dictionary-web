import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('devspeak stats utility exposes quiz daily APIs', () => {
  const exists = fs.existsSync('src/utils/devspeak-stats.js')
  assert.equal(exists, true)

  const content = fs.readFileSync('src/utils/devspeak-stats.js', 'utf8')
  assert.equal(content.includes('getTodayQuizAttempts'), true)
  assert.equal(content.includes('recordQuizAttempt'), true)
})
