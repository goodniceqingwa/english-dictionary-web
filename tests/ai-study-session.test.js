import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import {
  canStartPlannedQuiz,
  getLearnedRecommendedWords,
  getNextRecommendedWord,
  mergeRecommendedWords,
} from '../src/utils/learning-workflow.js'
import { aiCoachRuntime, useAICoachStore } from '../src/stores/aiCoach.js'

test('mergeRecommendedWords keeps plan order and removes duplicates', () => {
  const words = mergeRecommendedWords(
    ['api', 'cache', 'api'],
    ['queue', 'cache']
  )

  assert.deepEqual(words, ['api', 'cache', 'queue'])
})

test('planned quiz readiness only counts recommended words, not fallback random words', () => {
  const learnedRecommendedWords = getLearnedRecommendedWords(
    ['api', 'cache'],
    ['api', 'random-word']
  )

  assert.deepEqual(learnedRecommendedWords, ['api'])
  assert.equal(
    canStartPlannedQuiz({
      recommendedWords: ['api', 'cache'],
      learnedWords: ['api', 'random-word'],
      minimum: 2,
    }),
    false
  )
  assert.equal(
    canStartPlannedQuiz({
      recommendedWords: ['api', 'cache'],
      learnedWords: ['api', 'cache', 'random-word'],
      minimum: 2,
    }),
    true
  )
})

test('next recommended word skips learned and invalid planned words', () => {
  assert.equal(
    getNextRecommendedWord(['api', 'cache', 'queue'], [], []),
    'api'
  )
  assert.equal(
    getNextRecommendedWord(['api', 'cache', 'queue'], ['api'], []),
    'cache'
  )
  assert.equal(
    getNextRecommendedWord(['api', 'cache', 'queue'], ['api'], ['cache']),
    'queue'
  )
  assert.equal(
    getNextRecommendedWord(['api'], ['api'], []),
    null
  )
})

test('ai coach store starts planned study and advances to quiz_ready after enough planned words are learned', async () => {
  setActivePinia(createPinia())
  const store = useAICoachStore()

  store.dailyPlan = {
    sessionTitle: 'API 调试冲刺',
    goals: ['学会解释接口错误'],
    recommendedWords: ['api', 'cache', 'queue'],
    tasks: [{ taskType: 'study', title: '学习推荐词', done: false }],
  }

  assert.deepEqual(store.recommendedWords, ['api', 'cache', 'queue'])
  assert.equal(store.currentLearningGoal, 'API 调试冲刺')
  assert.equal(store.isPlannedStudyActive, false)

  await store.startPlannedStudy()
  assert.equal(store.activeRun.currentStage, 'studying')
  assert.deepEqual(store.activeRun.recommendedWords, ['api', 'cache', 'queue'])
  assert.equal(store.isPlannedStudyActive, true)

  await store.markPlanTaskDone('study', {
    learnedWords: ['api', 'cache', 'queue'],
    minimum: 3,
  })

  assert.equal(store.activeRun.currentStage, 'quiz_ready')
  assert.equal(store.activeRun.status, 'quiz_ready')
  assert.equal(store.dailyPlan.tasks[0].done, true)
})

test('ai coach store saves profile and persists a generated daily plan through the workflow api', async (t) => {
  setActivePinia(createPinia())
  const store = useAICoachStore()

  const originalUpsertProfile = aiCoachRuntime.aiProfiles.upsertProfile
  const originalCreateRun = aiCoachRuntime.workflowRuns.createRun
  const originalUpdateRun = aiCoachRuntime.workflowRuns.updateRun
  const originalAddEvent = aiCoachRuntime.workflowEvents.addEvent
  const originalGetRunEvents = aiCoachRuntime.workflowEvents.getRunEvents
  const originalInvoke = aiCoachRuntime.invokeLearningWorkflow

  const recordedCalls = {
    upsertProfile: [],
    createRun: [],
    updateRun: [],
    addEvent: [],
    getRunEvents: [],
    invoke: [],
  }

  t.after(() => {
    aiCoachRuntime.aiProfiles.upsertProfile = originalUpsertProfile
    aiCoachRuntime.workflowRuns.createRun = originalCreateRun
    aiCoachRuntime.workflowRuns.updateRun = originalUpdateRun
    aiCoachRuntime.workflowEvents.addEvent = originalAddEvent
    aiCoachRuntime.workflowEvents.getRunEvents = originalGetRunEvents
    aiCoachRuntime.invokeLearningWorkflow = originalInvoke
  })

  aiCoachRuntime.aiProfiles.upsertProfile = async (payload) => {
    recordedCalls.upsertProfile.push(payload)
    return { data: payload, error: null }
  }
  aiCoachRuntime.workflowRuns.createRun = async (payload) => {
    recordedCalls.createRun.push(payload)
    return {
      data: {
        id: 'run-1',
        user_id: payload.user_id,
        status: payload.status,
        current_stage: payload.currentStage,
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
  aiCoachRuntime.workflowEvents.getRunEvents = async (runId) => {
    recordedCalls.getRunEvents.push(runId)
    return {
      data: [
        { id: 1, run_id: runId, event_type: 'generate_daily_plan', status: 'completed' },
      ],
      error: null,
    }
  }
  aiCoachRuntime.invokeLearningWorkflow = async (body) => {
    recordedCalls.invoke.push({ name: 'learning-workflow', body })
    return {
      data: {
        ok: true,
        action: 'generateDailyPlan',
        data: {
          sessionTitle: 'API 调试冲刺',
          goals: ['完成推荐词学习'],
          tasks: [
            {
              title: '学习推荐词',
              taskType: 'study',
              instructions: '优先完成推荐词并打分',
            },
          ],
          recommendedWords: ['api', 'cache'],
          coachTip: '先复述英文，再看中文。',
        },
        meta: {
          responseId: 'resp-1',
          model: 'gpt-4.1-mini',
        },
      },
      error: null,
    }
  }

  await store.saveProfile({
    goal: '提升技术表达',
    level: 'A2',
    weeklyHours: '5 小时',
    focus: 'standup',
  }, {
    userId: 'user-1',
  })

  const plan = await store.generateDailyPlan({
    userId: 'user-1',
    progressSnapshot: {
      totalWords: 8,
      learnedToday: 3,
      dueWords: 2,
      masteredWords: 1,
      learnedWordsInSession: ['api'],
    },
    recentActivity: {
      collectedWords: ['cache'],
      currentStage: 'profile_ready',
    },
  })

  assert.equal(recordedCalls.upsertProfile.length, 1)
  assert.equal(recordedCalls.upsertProfile[0].user_id, 'user-1')
  assert.equal(recordedCalls.createRun.length, 1)
  assert.equal(recordedCalls.invoke.length, 1)
  assert.equal(recordedCalls.invoke[0].name, 'learning-workflow')
  assert.equal(recordedCalls.invoke[0].body.action, 'generateDailyPlan')
  assert.equal(recordedCalls.invoke[0].body.profile.goal, '提升技术表达')
  assert.equal(recordedCalls.invoke[0].body.progressSnapshot.learnedToday, 3)
  assert.deepEqual(recordedCalls.invoke[0].body.progressSnapshot.learnedWordsInSession, ['api'])
  assert.deepEqual(recordedCalls.invoke[0].body.recentActivity.collectedWords, ['cache'])
  assert.equal(recordedCalls.updateRun.length, 1)
  assert.equal(recordedCalls.updateRun[0].runId, 'run-1')
  assert.equal(recordedCalls.updateRun[0].payload.currentStage, 'plan_ready')
  assert.deepEqual(recordedCalls.updateRun[0].payload.planJson.recommendedWords, ['api', 'cache'])
  assert.equal(recordedCalls.addEvent.length, 1)
  assert.deepEqual(recordedCalls.getRunEvents, ['run-1'])
  assert.equal(store.profile.goal, '提升技术表达')
  assert.equal(plan.sessionTitle, 'API 调试冲刺')
  assert.deepEqual(store.dailyPlan.recommendedWords, ['api', 'cache'])
  assert.equal(store.activeRun.runId, 'run-1')
  assert.equal(store.activeRun.currentStage, 'plan_ready')
  assert.equal(store.activeRun.status, 'plan_ready')
  assert.equal(store.runEvents.length, 1)
})

test('ai coach store can clear planned state on sign out', () => {
  setActivePinia(createPinia())
  const store = useAICoachStore()

  store.profile = { goal: '提升表达' }
  store.activeRun = { currentStage: 'quiz_ready' }
  store.dailyPlan = { recommendedWords: ['api'] }
  store.reflection = { summary: 'done' }

  store.resetCoachState()

  assert.equal(store.profile, null)
  assert.equal(store.activeRun, null)
  assert.equal(store.dailyPlan, null)
  assert.equal(store.reflection, null)
})

test('ai coach store restores the latest persisted profile and run state', async (t) => {
  setActivePinia(createPinia())
  const store = useAICoachStore()

  const originalGetProfile = aiCoachRuntime.aiProfiles.getProfile
  const originalGetLatestRun = aiCoachRuntime.workflowRuns.getLatestRun
  const originalGetRunEvents = aiCoachRuntime.workflowEvents.getRunEvents

  t.after(() => {
    aiCoachRuntime.aiProfiles.getProfile = originalGetProfile
    aiCoachRuntime.workflowRuns.getLatestRun = originalGetLatestRun
    aiCoachRuntime.workflowEvents.getRunEvents = originalGetRunEvents
  })

  aiCoachRuntime.aiProfiles.getProfile = async () => ({
    data: {
      user_id: 'user-1',
      target_goal: '提升技术表达',
      current_level: 'A2',
      focus_topics: ['standup', 'review'],
    },
    error: null,
  })
  aiCoachRuntime.workflowRuns.getLatestRun = async () => ({
    data: {
      id: 'run-9',
      status: 'plan_ready',
      current_stage: 'plan_ready',
      plan_json: {
        sessionTitle: 'API 调试冲刺',
        goals: ['完成推荐词学习'],
        tasks: [],
        recommendedWords: ['api'],
        coachTip: 'tip',
      },
    },
    error: null,
  })
  aiCoachRuntime.workflowEvents.getRunEvents = async () => ({
    data: [
      {
        id: 3,
        run_id: 'run-9',
        event_type: 'generate_daily_plan',
        status: 'completed',
        created_at: '2026-04-22T09:00:00.000Z',
      },
    ],
    error: null,
  })

  const restored = await store.loadCoachState('user-1')

  assert.equal(restored.profile.goal, '提升技术表达')
  assert.equal(restored.activeRun.runId, 'run-9')
  assert.equal(restored.activeRun.currentStage, 'plan_ready')
  assert.equal(restored.dailyPlan.sessionTitle, 'API 调试冲刺')
  assert.deepEqual(store.dailyPlan.recommendedWords, ['api'])
  assert.equal(store.runEvents.length, 1)
  assert.equal(store.runEvents[0].event_type, 'generate_daily_plan')
})

test('study and quiz views use active planned gating and next unseen recommended word selection', () => {
  const studyContent = fs.readFileSync('src/views/Study.vue', 'utf8')
  const quizContent = fs.readFileSync('src/views/StudyQuiz.vue', 'utf8')
  const appContent = fs.readFileSync('src/App.vue', 'utf8')
  const coachStoreContent = fs.readFileSync('src/stores/aiCoach.js', 'utf8')

  assert.match(studyContent, /async function loadRecommendedWord\(\)/)
  assert.match(studyContent, /getNextRecommendedWord\(/)
  assert.match(studyContent, /invalidRecommendedWords/)
  assert.match(studyContent, /if \(!loadedRecommendedWord\)\s*{\s*await loadFallbackRandomWord\(\)/)
  assert.match(studyContent, /AI 学习目标/)
  assert.match(studyContent, /canStartPlannedQuiz\(/)
  assert.match(studyContent, /markPlanTaskDone\('study'/)
  assert.match(studyContent, /aiCoachStore\.isPlannedStudyActive/)
  assert.match(studyContent, /学习会话面板/)
  assert.match(studyContent, /推荐词进度/)
  assert.match(studyContent, /learningStore\.learnedWordsInSession/)
  assert.match(studyContent, /to="\/coach"/)

  assert.match(quizContent, /useAICoachStore/)
  assert.match(quizContent, /const hasLearnedWords = computed\(\(\) => learningStore\.learnedWordsInSession\.length > 0\)/)
  assert.match(quizContent, /contextualQuestions/)
  assert.match(quizContent, /activeRun\?\.currentStage === 'quiz_ready'/)

  assert.match(coachStoreContent, /invokeLearningWorkflow\(/)
  assert.match(coachStoreContent, /buildDailyPlanPayload\(/)
  assert.match(coachStoreContent, /workflowRuns\.createRun\(/)
  assert.match(coachStoreContent, /workflowRuns\.updateRun\(/)
  assert.match(coachStoreContent, /async function loadCoachState\(/)
  assert.match(coachStoreContent, /workflowRuns\.getLatestRun\(/)
  assert.match(coachStoreContent, /workflowEvents\.getRunEvents\(/)
  assert.match(coachStoreContent, /const runEvents = ref\(\[\]\)/)

  assert.match(appContent, /useAICoachStore/)
  assert.match(appContent, /aiCoachStore\.loadCoachState\(/)
  assert.match(appContent, /aiCoachStore\.resetCoachState\(\)/)
})
