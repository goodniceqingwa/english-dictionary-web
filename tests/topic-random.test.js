import test from 'node:test'
import assert from 'node:assert/strict'
import { pickRandomWords } from '../src/utils/topic-filter.js'
import { getRandomTopicWords } from '../src/utils/dictionary.js'

test('pickRandomWords returns unique random subset with size limit', () => {
  const result = pickRandomWords(['a', 'b', 'c'], 2)
  assert.equal(result.length, 2)
  assert.equal(new Set(result).size, 2)
})

test('getRandomTopicWords export exists', () => {
  assert.equal(typeof getRandomTopicWords, 'function')
})
