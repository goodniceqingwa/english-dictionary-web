import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('learning store exposes session queue APIs', () => {
  const content = fs.readFileSync('src/stores/learning.js', 'utf8')
  assert.equal(content.includes('sessionQueue'), true)
  assert.equal(content.includes('addSessionWord'), true)
  assert.equal(content.includes('goToPreviousSessionWord'), true)
  assert.equal(content.includes('goToNextSessionWord'), true)
})
