import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  canStartPlannedQuiz,
  createWorkflowRun,
  nextWorkflowStage,
} from '../utils/learning-workflow.js'
import {
  buildAiQuizPayload,
  buildDailyPlanPayload,
  buildReflectionPayload,
} from '../utils/ai-payloads.js'
import { invokeLearningWorkflow } from '../utils/ai.js'
import {
  aiProfiles,
  workflowEvents,
  workflowRuns,
} from '../utils/supabase.js'

export const aiCoachRuntime = {
  invokeLearningWorkflow,
  aiProfiles,
  workflowRuns,
  workflowEvents,
}

function normalizeRunRecord(record) {
  if (!record || typeof record !== 'object') {
    return null
  }

  return {
    ...record,
    runId: record.runId || record.id || null,
    currentStage: record.currentStage || record.current_stage || 'idle',
    planJson: record.planJson ?? record.plan_json ?? null,
    reflectionJson: record.reflectionJson ?? record.reflection_json ?? null,
  }
}

function normalizeEventRecord(record) {
  if (!record || typeof record !== 'object') {
    return null
  }

  return {
    ...record,
    id: record.id ?? null,
    runId: record.runId || record.run_id || null,
    eventType: record.eventType || record.event_type || '',
    createdAt: record.createdAt || record.created_at || null,
    inputJson: record.inputJson || record.input_json || null,
    outputJson: record.outputJson || record.output_json || null,
  }
}

function parseAvailableMinutes(value) {
  const text = String(value || '').trim()
  const match = text.match(/(\d+(?:\.\d+)?)/)

  if (!match) {
    return 30
  }

  const amount = Number(match[1])
  if (!Number.isFinite(amount)) {
    return 30
  }

  return /小时/.test(text) ? Math.round(amount * 60) : Math.max(1, Math.round(amount))
}

function normalizeFocusTopics(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item || '').trim()).filter(Boolean)
  }

  return String(value || '')
    .split(/[，、,\n]/)
    .map(item => item.trim())
    .filter(Boolean)
}

function normalizeProfileRecord(record, fallback = {}) {
  if (!record || typeof record !== 'object') {
    return {
      ...(fallback || {}),
    }
  }

  return {
    ...(fallback || {}),
    id: record.id ?? fallback.id ?? null,
    userId: record.userId ?? record.user_id ?? fallback.userId ?? null,
    goal: record.goal ?? record.target_goal ?? fallback.goal ?? '',
    level: record.level ?? record.current_level ?? fallback.level ?? '',
    weeklyHours: fallback.weeklyHours ?? '',
    focus: record.focus
      ?? (Array.isArray(record.focus_topics) ? record.focus_topics.join('、') : fallback.focus ?? ''),
  }
}

function createFallbackContextualQuestions(tasks = []) {
  if (!tasks[0]) {
    return []
  }

  return [
    {
      type: 'choice',
      title: '本轮 AI 计划包含哪项任务？',
      correctAnswer: tasks[0],
      options: [
        tasks[0],
        '切换主题并刷新随机词',
        '完成一次自由跟读',
        '浏览设置页后退出学习'
      ]
    }
  ]
}

function matchesPlanTask(task, taskKey = '') {
  const normalizedKey = String(taskKey || '').trim().toLowerCase()
  if (!normalizedKey) {
    return false
  }

  const fields = [task?.taskType, task?.title, task?.id, task?.key, task?.type]
    .map(value => String(value || '').trim().toLowerCase())
    .filter(Boolean)

  if (fields.includes(normalizedKey)) {
    return true
  }

  if (normalizedKey === 'study') {
    return fields.some(value => /study|学习/.test(value))
  }

  if (normalizedKey === 'quiz') {
    return fields.some(value => /quiz|测验|测试/.test(value))
  }

  if (normalizedKey === 'reflection') {
    return fields.some(value => /reflection|reflect|复盘|总结/.test(value))
  }

  return false
}

export const useAICoachStore = defineStore('aiCoach', () => {
  const profile = ref(null)
  const activeRun = ref(null)
  const dailyPlan = ref(null)
  const runEvents = ref([])
  const quizRequest = ref(null)
  const quizResults = ref(null)
  const reflection = ref(null)
  const isPlannedStudyActive = computed(() =>
    Boolean(
      activeRun.value?.currentStage &&
      !['idle', 'completed'].includes(activeRun.value.currentStage)
    )
  )
  const recommendedWords = computed(() =>
    Array.isArray(dailyPlan.value?.recommendedWords)
      ? dailyPlan.value.recommendedWords.filter(Boolean)
      : []
  )
  const currentLearningGoal = computed(() => {
    if (!dailyPlan.value || typeof dailyPlan.value !== 'object') {
      return ''
    }

    if (typeof dailyPlan.value.sessionTitle === 'string' && dailyPlan.value.sessionTitle.trim()) {
      return dailyPlan.value.sessionTitle.trim()
    }

    const firstGoal = Array.isArray(dailyPlan.value.goals) ? dailyPlan.value.goals[0] : ''

    if (typeof firstGoal === 'string') {
      return firstGoal.trim()
    }

    if (firstGoal && typeof firstGoal === 'object') {
      return String(firstGoal.title || firstGoal.goal || firstGoal.text || '').trim()
    }

    return ''
  })
  const planTasks = computed(() =>
    Array.isArray(dailyPlan.value?.tasks)
      ? dailyPlan.value.tasks
        .map(task => String(task?.title || task?.instructions || task?.taskType || '').trim())
        .filter(Boolean)
      : []
  )

  function updatePlanTaskStatus(taskKey = '', nextStatus = 'done') {
    if (!dailyPlan.value || !Array.isArray(dailyPlan.value.tasks)) {
      return false
    }

    let hasUpdatedTask = false

    dailyPlan.value = {
      ...dailyPlan.value,
      tasks: dailyPlan.value.tasks.map((task) => {
        if (hasUpdatedTask || !matchesPlanTask(task, taskKey)) {
          return task
        }

        hasUpdatedTask = true
        const isDone = nextStatus === 'done'

        return {
          ...task,
          done: isDone,
          completed: isDone,
          status: nextStatus,
        }
      }),
    }

    return hasUpdatedTask
  }

  async function resolvePlanContext(overrides = {}) {
    const nextProfile = {
      ...(profile.value || {}),
      ...(overrides.profile || {}),
    }
    const defaultStage = activeRun.value?.currentStage || 'profile_ready'
    let userId = overrides.userId ?? null
    let progressSnapshot = overrides.progressSnapshot ?? null
    let recentActivity = overrides.recentActivity ?? null

    if (!userId || !progressSnapshot || !recentActivity) {
      try {
        const [{ useUserStore }, { useLearningStore }] = await Promise.all([
          import('./user.js'),
          import('./learning.js'),
        ])
        const userStore = useUserStore()
        const learningStore = useLearningStore()

        userId ||= userStore.user?.id || null

        progressSnapshot ||= {
          totalWords: Number(learningStore.stats?.totalWords || 0),
          learnedToday: Number(learningStore.stats?.learnedToday || 0),
          dueWords: Number(learningStore.stats?.dueWords || 0),
          masteredWords: Number(learningStore.stats?.masteredWords || 0),
          learnedWordsInSession: Array.isArray(learningStore.learnedWordsInSession)
            ? [...learningStore.learnedWordsInSession]
            : [],
        }

        recentActivity ||= {
          collectedWords: Array.isArray(learningStore.collectedWords)
            ? [...learningStore.collectedWords]
            : [],
          currentStage: defaultStage,
        }
      } catch {
        progressSnapshot ||= {
          totalWords: 0,
          learnedToday: 0,
          dueWords: 0,
          masteredWords: 0,
          learnedWordsInSession: [],
        }
        recentActivity ||= {
          collectedWords: [],
          currentStage: defaultStage,
        }
      }
    }

    return {
      userId,
      profile: nextProfile,
      progressSnapshot,
      recentActivity: {
        ...recentActivity,
        currentStage: recentActivity?.currentStage || defaultStage,
      },
    }
  }

  async function loadRunEvents(runId) {
    if (!runId) {
      runEvents.value = []
      return runEvents.value
    }

    const { data, error } = await aiCoachRuntime.workflowEvents.getRunEvents(runId)
    if (error) {
      return runEvents.value
    }

    runEvents.value = Array.isArray(data)
      ? data.map(normalizeEventRecord).filter(Boolean)
      : []

    return runEvents.value
  }

  async function saveProfile(payload = {}, options = {}) {
    const nextProfile = {
      ...(profile.value || {}),
      ...payload
    }
    profile.value = nextProfile

    const userId = options.userId || (await resolvePlanContext(options)).userId
    if (!userId) {
      return profile.value
    }

    const persistPayload = {
      user_id: userId,
      current_level: nextProfile.level || 'unknown',
      target_goal: nextProfile.goal || '',
      available_minutes: parseAvailableMinutes(nextProfile.weeklyHours),
      focus_topics: normalizeFocusTopics(nextProfile.focus),
    }

    const { data, error } = await aiCoachRuntime.aiProfiles.upsertProfile(persistPayload)
    if (!error && data) {
      profile.value = normalizeProfileRecord(data, nextProfile)
    }

    return profile.value
  }

  async function generateDailyPlan(options = {}) {
    const context = await resolvePlanContext(options)

    if (!context.userId) {
      return dailyPlan.value
    }

    let currentRun = normalizeRunRecord(activeRun.value)
    if (!currentRun?.runId || currentRun.currentStage === 'completed') {
      const runPayload = {
        user_id: context.userId,
        status: context.recentActivity.currentStage || 'profile_ready',
        currentStage: context.recentActivity.currentStage || 'profile_ready',
        startedAt: new Date().toISOString(),
      }
      const { data, error } = await aiCoachRuntime.workflowRuns.createRun(runPayload)
      if (error) {
        return dailyPlan.value
      }

      currentRun = normalizeRunRecord(data || runPayload)
      activeRun.value = currentRun
    }

    const requestPayload = buildDailyPlanPayload({
      runId: currentRun.runId,
      profile: context.profile,
      progressSnapshot: context.progressSnapshot,
      recentActivity: context.recentActivity,
    })
    const { data, error } = await aiCoachRuntime.invokeLearningWorkflow(requestPayload)
    if (error || !data?.ok || !data.data) {
      return dailyPlan.value
    }

    dailyPlan.value = data.data

    const nextRunPayload = {
      status: 'plan_ready',
      currentStage: 'plan_ready',
      planJson: data.data,
    }
    const { data: updatedRun } = await aiCoachRuntime.workflowRuns.updateRun(currentRun.runId, nextRunPayload)
    await aiCoachRuntime.workflowEvents.addEvent({
      run_id: currentRun.runId,
      event_type: 'generate_daily_plan',
      input_json: requestPayload,
      output_json: data,
      status: 'completed',
    })
    await loadRunEvents(currentRun.runId)

    activeRun.value = {
      ...(normalizeRunRecord(updatedRun) || currentRun),
      runId: currentRun.runId,
      status: 'plan_ready',
      currentStage: 'plan_ready',
      recommendedWords: Array.isArray(data.data?.recommendedWords)
        ? [...data.data.recommendedWords]
        : [],
    }

    return dailyPlan.value
  }

  async function loadCoachState(userId) {
    if (!userId) {
      return {
        profile: profile.value,
        activeRun: activeRun.value,
        dailyPlan: dailyPlan.value,
      }
    }

    const [{ data: profileData }, { data: latestRun }] = await Promise.all([
      aiCoachRuntime.aiProfiles.getProfile(userId),
      aiCoachRuntime.workflowRuns.getLatestRun(userId),
    ])

    profile.value = normalizeProfileRecord(profileData, profile.value || {})

    const normalizedRun = normalizeRunRecord(latestRun)
    activeRun.value = normalizedRun
    dailyPlan.value = normalizedRun?.planJson || dailyPlan.value
    reflection.value = normalizedRun?.reflectionJson || reflection.value
    await loadRunEvents(normalizedRun?.runId)

    return {
      profile: profile.value,
      activeRun: activeRun.value,
      dailyPlan: dailyPlan.value,
    }
  }

  async function startPlannedStudy() {
    if (!dailyPlan.value) {
      return null
    }

    if (
      activeRun.value?.currentStage &&
      !['idle', 'completed'].includes(activeRun.value.currentStage)
    ) {
      return activeRun.value
    }

    if (activeRun.value?.currentStage === 'completed') {
      quizRequest.value = null
      quizResults.value = null
      reflection.value = null
    }

    activeRun.value = {
      ...createWorkflowRun(),
      status: 'active',
      currentStage: nextWorkflowStage('plan_ready'),
      recommendedWords: [...recommendedWords.value],
    }

    return activeRun.value
  }

  async function markPlanTaskDone(taskKey = '', payload = {}) {
    if (!dailyPlan.value) {
      return null
    }

    if (!activeRun.value) {
      await startPlannedStudy()
    }

    if (taskKey) {
      updatePlanTaskStatus(taskKey, 'done')
    }

    const minimum = payload.minimum ?? Math.max(1, Math.min(recommendedWords.value.length, 5))
    if (
      activeRun.value?.currentStage === 'studying' &&
      canStartPlannedQuiz({
        recommendedWords: recommendedWords.value,
        learnedWords: payload.learnedWords,
        minimum,
      })
    ) {
      activeRun.value = {
        ...activeRun.value,
        status: 'quiz_ready',
        currentStage: nextWorkflowStage(activeRun.value.currentStage),
      }
    }

    return activeRun.value
  }

  async function generateQuiz(payload = {}) {
    const learnedWords = Array.isArray(payload.learnedWords)
      ? payload.learnedWords.filter(Boolean)
      : [...recommendedWords.value]
    const tasks = Array.isArray(payload.planTasks)
      ? payload.planTasks.filter(Boolean)
      : [...planTasks.value]
    const requestPayload = buildAiQuizPayload({
      runId: payload.runId ?? activeRun.value?.runId ?? null,
      learnedWords,
      planTasks: tasks,
    })
    const shouldUseWorkflow = activeRun.value?.currentStage === 'quiz_ready' && Boolean(requestPayload.runId)
    let contextualQuestions = createFallbackContextualQuestions(tasks)

    if (shouldUseWorkflow) {
      const { data, error } = await aiCoachRuntime.invokeLearningWorkflow(requestPayload)
      if (!error && data?.ok && Array.isArray(data.data?.contextualQuestions)) {
        contextualQuestions = data.data.contextualQuestions
      }

      await aiCoachRuntime.workflowEvents.addEvent({
        run_id: requestPayload.runId,
        event_type: 'generate_quiz',
        input_json: requestPayload,
        output_json: error ? { error } : (data || { contextualQuestions }),
        status: error ? 'failed' : 'completed',
      })
      await loadRunEvents(requestPayload.runId)
    }

    quizRequest.value = {
      ...requestPayload,
      contextualQuestions,
    }

    return quizRequest.value
  }

  async function saveQuizResults(payload = {}) {
    if (!activeRun.value || activeRun.value.currentStage !== 'quiz_ready') {
      return null
    }

    const answers = Array.isArray(payload.answers) ? payload.answers : []
    const wrongAnswers = Array.isArray(payload.wrongAnswers)
      ? payload.wrongAnswers
      : answers
        .filter(item => !item?.correct)
        .map((item) => ({
          title: item?.question?.title || item?.question || '',
          userAnswer: item?.userAnswer || '',
          correctAnswer: item?.question?.correctAnswer || item?.correctAnswer || '',
        }))

    quizResults.value = {
      runId: payload.runId ?? activeRun.value?.runId ?? quizRequest.value?.runId ?? null,
      learnedWords: Array.isArray(payload.learnedWords)
        ? payload.learnedWords.filter(Boolean)
        : [...(quizRequest.value?.learnedWords || [])],
      answers,
      wrongAnswers,
      accuracy: Number.isFinite(payload.accuracy) ? payload.accuracy : 0,
      correctCount: Number.isFinite(payload.correctCount) ? payload.correctCount : 0,
      totalCount: Number.isFinite(payload.totalCount) ? payload.totalCount : answers.length,
    }

    if (activeRun.value?.currentStage === 'quiz_ready') {
      updatePlanTaskStatus('quiz', 'done')
      activeRun.value = {
        ...activeRun.value,
        status: 'reflecting',
        currentStage: nextWorkflowStage(activeRun.value.currentStage),
      }
    }

    return quizResults.value
  }

  async function summarizeReflection(payload = {}) {
    if (!activeRun.value || activeRun.value.currentStage !== 'reflecting') {
      return null
    }

    const answers = Array.isArray(payload.quizAnswers) && payload.quizAnswers.length
      ? payload.quizAnswers
      : Array.isArray(quizResults.value?.answers)
        ? quizResults.value.answers.map((item) => ({
          question: item?.question?.title || item?.question || '',
          correct: Boolean(item?.correct),
          userAnswer: item?.userAnswer || '',
          correctAnswer: item?.question?.correctAnswer || item?.correctAnswer || '',
        }))
        : []
    const learnedWords = Array.isArray(payload.learnedWords) && payload.learnedWords.length
      ? payload.learnedWords.filter(Boolean)
      : Array.isArray(quizResults.value?.learnedWords) && quizResults.value.learnedWords.length
        ? [...quizResults.value.learnedWords]
        : [...(quizRequest.value?.learnedWords || [])]
    const incorrectAnswers = Array.isArray(quizResults.value?.wrongAnswers)
      ? quizResults.value.wrongAnswers
      : []
    const reflectionPayload = buildReflectionPayload({
      runId: payload.runId ?? activeRun.value?.runId ?? quizResults.value?.runId ?? quizRequest.value?.runId,
      learnedWords,
      quizAnswers: answers,
    })
    const { data, error } = await aiCoachRuntime.invokeLearningWorkflow(reflectionPayload)
    const fallbackReflection = {
      summary: incorrectAnswers.length > 0
        ? '本次测验存在错题，建议优先复盘再进入下一轮。'
        : '当前掌握情况稳定，可以继续下一步。',
      wins: [],
      blockers: incorrectAnswers.map((item) =>
        `${item.title}：你的答案 ${item.userAnswer || '（空）'}，正确答案 ${item.correctAnswer || '暂无'}`
      ),
      nextActions: incorrectAnswers.length > 0
        ? incorrectAnswers.slice(0, 3).map((item) => `重看 ${item.title}，并复述正确答案 ${item.correctAnswer || '暂无'}`)
        : ['继续学习下一组单词并保持当前节奏'],
    }
    const reflectionData = !error && data?.ok && data.data
      ? data.data
      : fallbackReflection

    reflection.value = {
      ...reflectionData,
      notes: String(payload.notes || '').trim(),
      payload: reflectionPayload,
    }

    await aiCoachRuntime.workflowRuns.updateRun(activeRun.value.runId, {
      status: 'completed',
      currentStage: 'completed',
      reflectionJson: reflection.value,
      completedAt: new Date().toISOString(),
    })
    await aiCoachRuntime.workflowEvents.addEvent({
      run_id: activeRun.value.runId,
      event_type: 'summarize_reflection',
      input_json: reflectionPayload,
      output_json: error ? { error } : (data || reflection.value),
      status: error ? 'failed' : 'completed',
    })
    await loadRunEvents(activeRun.value.runId)

    if (activeRun.value?.currentStage === 'reflecting') {
      updatePlanTaskStatus('reflection', 'done')
      activeRun.value = {
        ...activeRun.value,
        status: 'completed',
        currentStage: nextWorkflowStage(activeRun.value.currentStage),
      }
    }

    return reflection.value
  }

  function resetCoachState() {
    profile.value = null
    activeRun.value = null
    dailyPlan.value = null
    runEvents.value = []
    quizRequest.value = null
    quizResults.value = null
    reflection.value = null
  }

  return {
    profile,
    activeRun,
    dailyPlan,
    runEvents,
    quizRequest,
    quizResults,
    reflection,
    isPlannedStudyActive,
    recommendedWords,
    currentLearningGoal,
    planTasks,
    saveProfile,
    generateDailyPlan,
    loadCoachState,
    loadRunEvents,
    startPlannedStudy,
    markPlanTaskDone,
    generateQuiz,
    saveQuizResults,
    summarizeReflection,
    resetCoachState
  }
})
