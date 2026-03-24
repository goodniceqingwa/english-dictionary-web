import test from 'node:test'
import assert from 'node:assert/strict'
import { buildComputerTopicWords } from '../scripts/build-index.js'

test('buildComputerTopicWords returns unique filtered words', () => {
  const words = buildComputerTopicWords([
    { word: 'algorithm', definition: 'computer process' },
    { word: 'algorithm', definition: 'computer process' },
    { word: 'banana', definition: 'fruit' }
  ])

  assert.deepEqual(words, ['algorithm'])
})
