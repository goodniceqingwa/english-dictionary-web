const STAGE_ORDER = [
  'idle',
  'profile_ready',
  'plan_ready',
  'studying',
  'quiz_ready',
  'reflecting',
  'completed',
]

export function createWorkflowRun() {
  return {
    status: 'idle',
    currentStage: 'idle',
  }
}

export function mergeRecommendedWords(primary = [], fallback = []) {
  return [...new Set([...primary, ...fallback].filter(Boolean))]
}

export function getLearnedRecommendedWords(recommendedWords = [], learnedWords = []) {
  const learnedSet = new Set(Array.isArray(learnedWords) ? learnedWords : [])
  return mergeRecommendedWords(recommendedWords, []).filter(word => learnedSet.has(word))
}

export function getNextRecommendedWord(recommendedWords = [], sessionWords = [], invalidWords = []) {
  const seenWords = new Set(Array.isArray(sessionWords) ? sessionWords : [])
  const skippedWords = new Set(Array.isArray(invalidWords) ? invalidWords : [])

  return mergeRecommendedWords(recommendedWords, []).find(
    word => word && !seenWords.has(word) && !skippedWords.has(word)
  ) || null
}

export function canStartPlannedQuiz(input = {}) {
  const { recommendedWords = [], learnedWords = [], minimum } = input
  const plannedLearnedWords = getLearnedRecommendedWords(recommendedWords, learnedWords)
  const plannedMinimum = minimum ?? (recommendedWords.length > 0
    ? Math.max(1, Math.min(recommendedWords.length, 5))
    : 0)

  return plannedMinimum > 0 && canStartAiQuiz({
    learnedWords: plannedLearnedWords,
    minimum: plannedMinimum,
  })
}

export function nextWorkflowStage(stage) {
  const index = STAGE_ORDER.indexOf(stage)
  if (index === -1) {
    return null
  }

  return STAGE_ORDER[index + 1] || stage
}

export function canStartAiQuiz(input = {}) {
  if (!input || typeof input !== 'object') {
    return false
  }

  const { learnedWords = [], minimum = 5 } = input

  if (!Array.isArray(learnedWords)) {
    return false
  }

  return learnedWords.length >= minimum
}
