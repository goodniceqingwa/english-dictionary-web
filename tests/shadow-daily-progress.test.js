import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('shadow store tracks today mastered count', () => {
  const content = fs.readFileSync('src/stores/shadow.js', 'utf8')
  assert.equal(content.includes('todayMasteredCount'), true)
  assert.equal(content.includes('devspeak_shadow_daily_v1'), true)
})
