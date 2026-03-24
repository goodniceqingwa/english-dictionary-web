import test from 'node:test'
import assert from 'node:assert/strict'
import { isComputerRelatedEntry } from '../src/utils/topic-filter.js'

test('matches programming related English keyword', () => {
  const matched = isComputerRelatedEntry({
    word: 'algorithm',
    definition: 'a process used by a computer program'
  })
  assert.equal(matched, true)
})

test('filters non-computer context with weak keywords only', () => {
  const matched = isComputerRelatedEntry({
    word: 'memory',
    definition: 'the ability to remember past events'
  })
  assert.equal(matched, false)
})
