import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { shadowScenarios } from '@/data/shadow-scenarios'

const SHADOW_PROGRESS_KEY = 'devspeak_shadow_progress_v1'

function createDefaultProgress() {
  const progress = {}

  for (const scene of shadowScenarios) {
    progress[scene.id] = {
      completedSentences: [],
      lastPracticed: null
    }
  }

  return progress
}

function normalizeProgress(raw) {
  const next = createDefaultProgress()

  if (!raw || typeof raw !== 'object') {
    return next
  }

  for (const scene of shadowScenarios) {
    const sceneProgress = raw[scene.id]
    if (!sceneProgress || typeof sceneProgress !== 'object') continue

    const validIds = new Set(scene.sentences.map(sentence => sentence.id))
    const completed = Array.isArray(sceneProgress.completedSentences)
      ? sceneProgress.completedSentences.filter(id => validIds.has(id))
      : []

    next[scene.id] = {
      completedSentences: Array.from(new Set(completed)),
      lastPracticed: sceneProgress.lastPracticed || null
    }
  }

  return next
}

function loadShadowProgress() {
  try {
    const raw = localStorage.getItem(SHADOW_PROGRESS_KEY)
    if (!raw) {
      return createDefaultProgress()
    }

    return normalizeProgress(JSON.parse(raw))
  } catch (error) {
    console.warn('读取跟读进度失败:', error)
    return createDefaultProgress()
  }
}

export const useShadowStore = defineStore('shadow', () => {
  const activeSceneId = ref(shadowScenarios[0]?.id || '')
  const shadowProgress = ref(loadShadowProgress())

  const sceneList = computed(() => shadowScenarios)

  const totalSentenceCount = computed(() =>
    shadowScenarios.reduce((total, scene) => total + scene.sentences.length, 0)
  )

  const totalMasteredSentences = computed(() =>
    shadowScenarios.reduce((total, scene) => {
      const completed = shadowProgress.value[scene.id]?.completedSentences || []
      return total + completed.length
    }, 0)
  )

  const sceneProgressSummary = computed(() =>
    shadowScenarios.map(scene => {
      const completed = shadowProgress.value[scene.id]?.completedSentences?.length || 0
      const total = scene.sentences.length
      const rate = total > 0 ? completed / total : 0

      return {
        sceneId: scene.id,
        completed,
        total,
        rate
      }
    })
  )

  const scenesAtSixtyPercent = computed(() =>
    sceneProgressSummary.value.filter(item => item.rate >= 0.6)
  )

  const flashcardUnlocked = computed(() => scenesAtSixtyPercent.value.length >= 3)

  function saveShadowProgress() {
    try {
      localStorage.setItem(SHADOW_PROGRESS_KEY, JSON.stringify(shadowProgress.value))
    } catch (error) {
      console.warn('保存跟读进度失败:', error)
    }
  }

  function setActiveScene(sceneId) {
    if (!sceneList.value.some(scene => scene.id === sceneId)) return
    activeSceneId.value = sceneId
  }

  function getSceneProgress(sceneId) {
    return shadowProgress.value[sceneId] || {
      completedSentences: [],
      lastPracticed: null
    }
  }

  function getSceneCompletion(sceneId) {
    const scene = sceneList.value.find(item => item.id === sceneId)
    if (!scene) {
      return {
        completed: 0,
        total: 0,
        rate: 0
      }
    }

    const completed = getSceneProgress(sceneId).completedSentences.length
    const total = scene.sentences.length

    return {
      completed,
      total,
      rate: total > 0 ? completed / total : 0
    }
  }

  function isSentenceMastered(sceneId, sentenceId) {
    return getSceneProgress(sceneId).completedSentences.includes(sentenceId)
  }

  function markSentenceMastered(sceneId, sentenceId) {
    const progress = getSceneProgress(sceneId)

    if (!progress.completedSentences.includes(sentenceId)) {
      progress.completedSentences.push(sentenceId)
    }

    progress.lastPracticed = new Date().toISOString()
    shadowProgress.value[sceneId] = progress
    saveShadowProgress()
  }

  function unmarkSentenceMastered(sceneId, sentenceId) {
    const progress = getSceneProgress(sceneId)
    progress.completedSentences = progress.completedSentences.filter(id => id !== sentenceId)
    progress.lastPracticed = new Date().toISOString()
    shadowProgress.value[sceneId] = progress
    saveShadowProgress()
  }

  function toggleSentenceMastered(sceneId, sentenceId) {
    if (isSentenceMastered(sceneId, sentenceId)) {
      unmarkSentenceMastered(sceneId, sentenceId)
      return false
    }

    markSentenceMastered(sceneId, sentenceId)
    return true
  }

  function resetShadowProgress() {
    shadowProgress.value = createDefaultProgress()
    saveShadowProgress()
  }

  return {
    activeSceneId,
    shadowProgress,
    sceneList,
    totalSentenceCount,
    totalMasteredSentences,
    sceneProgressSummary,
    scenesAtSixtyPercent,
    flashcardUnlocked,
    setActiveScene,
    getSceneProgress,
    getSceneCompletion,
    isSentenceMastered,
    markSentenceMastered,
    unmarkSentenceMastered,
    toggleSentenceMastered,
    resetShadowProgress
  }
})
