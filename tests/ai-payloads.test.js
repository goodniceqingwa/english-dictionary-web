import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildDailyPlanPayload,
  buildReflectionPayload,
} from '../src/utils/ai-payloads.js'

test('buildDailyPlanPayload normalizes the workflow request', () => {
  const payload = buildDailyPlanPayload({
    runId: 'run-1',
    profile: { currentLevel: 'A2', targetGoal: '前端面试英语' },
    progressSnapshot: { dueWords: 8 },
    recentActivity: { currentStage: 'profile_ready' },
  })

  assert.equal(payload.action, 'generateDailyPlan')
  assert.equal(payload.runId, 'run-1')
  assert.equal(payload.profile.targetGoal, '前端面试英语')
  assert.equal(payload.progressSnapshot.dueWords, 8)
  assert.equal(payload.recentActivity.currentStage, 'profile_ready')
})

test('buildReflectionPayload includes quiz answers and learned words', () => {
  const payload = buildReflectionPayload({
    runId: 'run-1',
    learnedWords: ['api', 'cache'],
    quizAnswers: [{ id: 'q1', correct: false }],
  })

  assert.equal(payload.action, 'summarizeReflection')
  assert.equal(payload.runId, 'run-1')
  assert.equal(payload.learnedWords.length, 2)
  assert.equal(payload.quizAnswers.length, 1)
})
