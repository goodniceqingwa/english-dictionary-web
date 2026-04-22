export function buildDailyPlanPayload({
  runId = null,
  profile = {},
  progressSnapshot = {},
  recentActivity = {},
} = {}) {
  return {
    action: 'generateDailyPlan',
    runId,
    profile,
    progressSnapshot,
    recentActivity,
  }
}

export function buildAiQuizPayload({
  runId,
  learnedWords = [],
  planTasks = [],
} = {}) {
  return {
    action: 'generateQuiz',
    runId,
    learnedWords,
    planTasks,
  }
}

export function buildReflectionPayload({
  runId,
  learnedWords = [],
  quizAnswers = [],
} = {}) {
  return {
    action: 'summarizeReflection',
    runId,
    learnedWords,
    quizAnswers,
  }
}
