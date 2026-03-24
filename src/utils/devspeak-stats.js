const DEV_SPEAK_DAILY_STATS_KEY = 'devspeak_daily_stats_v1'

function getTodayDateString() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function getDefaultDailyStats(date = getTodayDateString()) {
  return {
    date,
    quizAttempts: 0
  }
}

function saveDailyStats(stats) {
  try {
    localStorage.setItem(DEV_SPEAK_DAILY_STATS_KEY, JSON.stringify(stats))
  } catch (error) {
    console.warn('保存 DevSpeak 每日统计失败:', error)
  }
}

function loadDailyStats() {
  try {
    const raw = localStorage.getItem(DEV_SPEAK_DAILY_STATS_KEY)
    if (!raw) return getDefaultDailyStats()

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return getDefaultDailyStats()

    return {
      date: parsed.date || getTodayDateString(),
      quizAttempts: Number(parsed.quizAttempts) || 0
    }
  } catch (error) {
    console.warn('读取 DevSpeak 每日统计失败:', error)
    return getDefaultDailyStats()
  }
}

export function getTodayQuizAttempts() {
  const today = getTodayDateString()
  const stats = loadDailyStats()

  if (stats.date !== today) {
    const next = getDefaultDailyStats(today)
    saveDailyStats(next)
    return 0
  }

  return stats.quizAttempts
}

export function recordQuizAttempt() {
  const today = getTodayDateString()
  const stats = loadDailyStats()

  const next = stats.date === today
    ? {
        date: today,
        quizAttempts: stats.quizAttempts + 1
      }
    : {
        date: today,
        quizAttempts: 1
      }

  saveDailyStats(next)
  return next.quizAttempts
}
