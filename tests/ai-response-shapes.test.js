import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  dailyPlanShape,
  quizShape,
  reflectionShape,
} from '../src/utils/ai-response-shapes.js'

test('dailyPlanShape contains required top-level keys', () => {
  assert.deepEqual(
    Object.keys(dailyPlanShape.properties),
    ['sessionTitle', 'goals', 'tasks', 'recommendedWords', 'coachTip']
  )
})

test('reflectionShape contains summary and nextActions', () => {
  assert.ok(reflectionShape.properties.summary)
  assert.ok(reflectionShape.properties.nextActions)
})

test('quizShape contains contextual questions with options and answers', () => {
  assert.ok(quizShape.properties.contextualQuestions)
  assert.ok(quizShape.properties.contextualQuestions.items.properties.title)
  assert.ok(quizShape.properties.contextualQuestions.items.properties.correctAnswer)
  assert.ok(quizShape.properties.contextualQuestions.items.properties.options)
})

test('supabase function config no longer relies on legacy verify_jwt = true', () => {
  const content = fs.readFileSync('supabase/config.toml', 'utf8')
  assert.doesNotMatch(content, /verify_jwt\s*=\s*true/)
})

test('learning workflow function verifies bearer auth via createClient and getClaims', () => {
  const content = fs.readFileSync('supabase/functions/learning-workflow/index.ts', 'utf8')
  assert.match(content, /createClient/)
  assert.match(content, /\.auth\.getClaims\(token\)/)
  assert.match(content, /scheme\.toLowerCase\(\)\s*!==\s*'bearer'/)
  assert.match(content, /Supabase token verification is temporarily unavailable/)
  assert.match(content, /action !== 'generateDailyPlan' && action !== 'generateQuiz' && action !== 'summarizeReflection'/)
  assert.match(content, /if \(action === 'generateDailyPlan'\)/)
  assert.match(content, /if \(action === 'generateQuiz'\)/)
  assert.doesNotMatch(content, /decodeBase64Url/)
})

test('openai wrapper handles incomplete and refusal structured output states explicitly', () => {
  const content = fs.readFileSync('supabase/functions/_shared/openai.ts', 'utf8')
  assert.match(content, /status\s*===\s*'incomplete'/)
  assert.match(content, /incomplete_details/)
  assert.match(content, /type\s*===\s*'refusal'/)
  assert.match(content, /OpenAI returned an error while generating structured output/)
  assert.match(content, /OpenAI request failed/)
  assert.doesNotMatch(content, /OpenAI request failed with \$\{response\.status\}: \$\{errorText\}/)
})

test('learning workflow function maps controlled auth and openai errors without always falling through to 500', () => {
  const content = fs.readFileSync('supabase/functions/learning-workflow/index.ts', 'utf8')
  assert.match(content, /error instanceof HttpError/)
  assert.match(content, /error instanceof OpenAIResponseError/)
  assert.doesNotMatch(content, /const status = error instanceof HttpError \? error\.status : 500/)
})
