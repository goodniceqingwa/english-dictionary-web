import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { aiCoachRuntime, useAICoachStore } from '../src/stores/aiCoach.js'
import {
  buildAiQuizPayload,
  buildReflectionPayload,
} from '../src/utils/ai-payloads.js'

test('buildAiQuizPayload sends learned words and plan context', () => {
  const payload = buildAiQuizPayload({
    runId: 'run-2',
    learnedWords: ['api', 'cache'],
    planTasks: ['完成 5 个单词', '完成 1 次测验'],
  })

  assert.equal(payload.action, 'generateQuiz')
  assert.equal(payload.learnedWords.length, 2)
  assert.equal(payload.planTasks.length, 2)
})

test('buildReflectionPayload keeps wrong answers for explanation', () => {
  const payload = buildReflectionPayload({
    runId: 'run-2',
    learnedWords: ['api'],
    quizAnswers: [{ question: 'API', correct: false }],
  })

  assert.equal(payload.quizAnswers[0].correct, false)
})

test('ai coach store records quiz results and completes reflection flow', async (t) => {
  setActivePinia(createPinia())
  const store = useAICoachStore()

  store.dailyPlan = {
    tasks: [
      { title: '学习推荐词', taskType: 'study', done: true },
      { title: '完成 1 次测验', taskType: 'quiz', done: false },
      { title: '整理复盘', taskType: 'reflection', done: false },
    ],
  }
  store.activeRun = {
    runId: 'run-2',
    status: 'quiz_ready',
    currentStage: 'quiz_ready',
  }

  const originalInvoke = aiCoachRuntime.invokeLearningWorkflow
  const originalUpdateRun = aiCoachRuntime.workflowRuns.updateRun
  const originalAddEvent = aiCoachRuntime.workflowEvents.addEvent
  const recordedCalls = {
    invoke: [],
    updateRun: [],
    addEvent: [],
  }

  t.after(() => {
    aiCoachRuntime.invokeLearningWorkflow = originalInvoke
    aiCoachRuntime.workflowRuns.updateRun = originalUpdateRun
    aiCoachRuntime.workflowEvents.addEvent = originalAddEvent
  })

  aiCoachRuntime.invokeLearningWorkflow = async (body) => {
    recordedCalls.invoke.push(body)
    if (body.action === 'generateQuiz') {
      return {
        data: {
          ok: true,
          action: 'generateQuiz',
          data: {
            contextualQuestions: [
              {
                type: 'choice',
                title: '本轮 AI 计划包含哪项任务？',
                correctAnswer: '完成 5 个单词',
                options: ['完成 5 个单词', '切换主题', '退出学习', '刷新随机词'],
              },
            ],
          },
        },
        error: null,
      }
    }

    return {
      data: {
        ok: true,
        action: 'summarizeReflection',
        data: {
          summary: '建议优先复盘错题。',
          wins: [],
          blockers: ['API：你的答案 缓存，正确答案 接口'],
          nextActions: ['重看 API'],
        },
      },
      error: null,
    }
  }
  aiCoachRuntime.workflowRuns.updateRun = async (runId, payload) => {
    recordedCalls.updateRun.push({ runId, payload })
    return { data: { id: runId, ...payload }, error: null }
  }
  aiCoachRuntime.workflowEvents.addEvent = async (payload) => {
    recordedCalls.addEvent.push(payload)
    return { data: payload, error: null }
  }

  const quizPayload = await store.generateQuiz({
    learnedWords: ['api', 'cache'],
    planTasks: ['完成 5 个单词', '完成 1 次测验'],
  })

  assert.equal(quizPayload.action, 'generateQuiz')
  assert.equal(store.quizRequest.learnedWords.length, 2)
  assert.equal(store.quizRequest.contextualQuestions.length > 0, true)

  await store.saveQuizResults({
    learnedWords: ['api', 'cache'],
    answers: [
      {
        question: { title: 'API', correctAnswer: '接口' },
        userAnswer: '缓存',
        correct: false,
      },
    ],
    wrongAnswers: [
      {
        title: 'API',
        userAnswer: '缓存',
        correctAnswer: '接口',
      },
    ],
    accuracy: 0,
    correctCount: 0,
    totalCount: 1,
  })

  assert.equal(store.activeRun.currentStage, 'reflecting')
  assert.equal(store.quizResults.wrongAnswers.length, 1)
  assert.equal(store.dailyPlan.tasks[1].done, true)
  assert.equal(store.dailyPlan.tasks[2].done, false)

  const reflection = await store.summarizeReflection()

  assert.equal(recordedCalls.invoke[0].action, 'generateQuiz')
  assert.equal(recordedCalls.invoke[1].action, 'summarizeReflection')
  assert.equal(recordedCalls.updateRun.length >= 1, true)
  assert.equal(recordedCalls.addEvent.length >= 1, true)
  assert.equal(store.activeRun.currentStage, 'completed')
  assert.equal(store.dailyPlan.tasks[2].done, true)
  assert.equal(reflection.summary, '建议优先复盘错题。')
  assert.equal(Array.isArray(reflection.nextActions), true)
})

test('ai coach store does not persist quiz reflection before quiz_ready', async () => {
  setActivePinia(createPinia())
  const store = useAICoachStore()

  store.activeRun = {
    runId: 'run-3',
    status: 'active',
    currentStage: 'studying',
  }

  const savedQuizResults = await store.saveQuizResults({
    learnedWords: ['api'],
    answers: [{ question: { title: 'API' }, correct: true, userAnswer: 'API' }],
    accuracy: 100,
    correctCount: 1,
    totalCount: 1,
  })

  const reflection = await store.summarizeReflection({
    learnedWords: ['api'],
    quizAnswers: [{ question: 'API', correct: true }],
  })

  assert.equal(savedQuizResults, null)
  assert.equal(reflection, null)
  assert.equal(store.quizResults, null)
  assert.equal(store.reflection, null)
  assert.equal(store.activeRun.currentStage, 'studying')
})

test('ai coach store ignores quiz persistence when there is no active run', async () => {
  setActivePinia(createPinia())
  const store = useAICoachStore()

  const savedQuizResults = await store.saveQuizResults({
    learnedWords: ['api'],
    answers: [{ question: { title: 'API' }, correct: true, userAnswer: 'API' }],
    accuracy: 100,
    correctCount: 1,
    totalCount: 1,
  })

  const reflection = await store.summarizeReflection({
    learnedWords: ['api'],
    quizAnswers: [{ question: 'API', correct: true }],
  })

  assert.equal(savedQuizResults, null)
  assert.equal(reflection, null)
  assert.equal(store.quizResults, null)
  assert.equal(store.reflection, null)
})

test('completed planned run can be restarted when study page re-enters a plan', async () => {
  setActivePinia(createPinia())
  const store = useAICoachStore()

  store.dailyPlan = {
    recommendedWords: ['api', 'cache'],
  }
  store.activeRun = {
    status: 'completed',
    currentStage: 'completed',
  }

  await store.startPlannedStudy()

  assert.equal(store.activeRun.currentStage, 'studying')
  assert.equal(store.activeRun.status, 'active')
  assert.deepEqual(store.activeRun.recommendedWords, ['api', 'cache'])
})

test('restarting a completed planned run clears stale quiz and reflection state', async () => {
  setActivePinia(createPinia())
  const store = useAICoachStore()

  store.dailyPlan = {
    recommendedWords: ['api', 'cache'],
  }
  store.activeRun = {
    status: 'completed',
    currentStage: 'completed',
  }
  store.quizRequest = {
    learnedWords: ['stale-word'],
  }
  store.quizResults = {
    accuracy: 60,
  }
  store.reflection = {
    summary: '旧复盘',
  }

  await store.startPlannedStudy()

  assert.equal(store.quizRequest, null)
  assert.equal(store.quizResults, null)
  assert.equal(store.reflection, null)
  assert.equal(store.activeRun.currentStage, 'studying')
})

test('study quiz appends contextual questions without blocking the base quiz flow', () => {
  const quizContent = fs.readFileSync('src/views/StudyQuiz.vue', 'utf8')
  const coachContent = fs.readFileSync('src/views/AICoach.vue', 'utf8')

  assert.match(quizContent, /const hasLearnedWords = computed\(\(\) => learningStore\.learnedWordsInSession\.length > 0\)/)
  assert.match(quizContent, /contextualQuestions/)
  assert.match(quizContent, /return \[\.\.\.baseQuestions, \.\.\.contextualQuestions\.value\]/)
  assert.match(quizContent, /aiCoachStore\.activeRun\?\.currentStage === 'quiz_ready'/)
  assert.match(quizContent, /aiCoachStore\.generateQuiz\(/)
  assert.match(quizContent, /aiCoachStore\.saveQuizResults\(/)
  assert.match(quizContent, /aiCoachStore\.summarizeReflection\(/)
  assert.match(quizContent, /if \(savedQuizResults\)/)
  assert.match(coachContent, /coachStore\.generateQuiz\(/)
  assert.match(coachContent, /coachStore\.summarizeReflection\(/)

  assert.match(coachContent, /coachStore\.quizResults/)
  assert.match(coachContent, /coachStore\.reflection\.summary/)
  assert.match(coachContent, /coachStore\.reflection\.nextActions/)
})
