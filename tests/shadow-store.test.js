import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('shadow store exposes progress and unlock APIs', () => {
  const exists = fs.existsSync('src/stores/shadow.js')
  assert.equal(exists, true)

  const content = fs.readFileSync('src/stores/shadow.js', 'utf8')
  assert.equal(content.includes('shadowProgress'), true)
  assert.equal(content.includes('markSentenceMastered'), true)
  assert.equal(content.includes('flashcardUnlocked'), true)
})
