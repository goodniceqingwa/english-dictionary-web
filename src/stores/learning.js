import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { collections, progress } from '@/utils/supabase'
import { calculateNextReview } from '@/utils/sm2'
import { getCache, setCache, clearAllUserCache, addToSyncQueue, getSyncQueue, removeFromSyncQueue } from '@/utils/cache'
import { useUserStore } from './user'

export const useLearningStore = defineStore('learning', () => {
  const userStore = useUserStore()

  const collectionList = ref([])
  const progressList = ref([])
  const stats = ref({
    totalWords: 0,
    learnedToday: 0,
    dueWords: 0,
    masteredWords: 0
  })
  const loading = ref(false)
  const error = ref(null)
  const isSyncing = ref(false)

  // 学习会话状态（用于前后导航与测试）
  const sessionQueue = ref([])
  const sessionWordMap = ref({})
  const currentSessionIndex = ref(-1)
  const learnedWordsInSession = ref([])

  const dueWords = computed(() => {
    const now = new Date()
    return progressList.value.filter(p => new Date(p.next_review) <= now)
  })

  const collectedWords = computed(() =>
    collectionList.value.map(c => c.word)
  )

  const hasPreviousSessionWord = computed(() => currentSessionIndex.value > 0)
  const hasNextSessionWord = computed(() =>
    currentSessionIndex.value >= 0 && currentSessionIndex.value < sessionQueue.value.length - 1
  )

  // 监听用户变化，加载缓存或清除数据
  watch(() => userStore.user, (newUser, oldUser) => {
    if (newUser && newUser.id !== oldUser?.id) {
      loadFromCache()
      syncWithServer()
    } else if (!newUser) {
      // 用户登出，清除内存数据
      collectionList.value = []
      progressList.value = []
      stats.value = {
        totalWords: 0,
        learnedToday: 0,
        dueWords: 0,
        masteredWords: 0
      }
      resetStudySession()
    }
  })

  // 从本地缓存加载数据
  function loadFromCache() {
    if (!userStore.user) return

    const userId = userStore.user.id

    // 加载收藏缓存
    const cachedCollections = getCache(userId, 'collections')
    if (cachedCollections) {
      collectionList.value = cachedCollections
    }

    // 加载进度缓存
    const cachedProgress = getCache(userId, 'progress')
    if (cachedProgress) {
      progressList.value = cachedProgress
      calculateStats()
    }
  }

  // 保存到本地缓存
  function saveToCache() {
    if (!userStore.user) return

    const userId = userStore.user.id
    setCache(userId, 'collections', collectionList.value)
    setCache(userId, 'progress', progressList.value)
  }

  // 计算统计数据（本地计算，无需请求服务器）
  function calculateStats() {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    stats.value = {
      totalWords: progressList.value.length,
      learnedToday: progressList.value.filter(p => {
        if (!p.last_reviewed) return false
        const lastReviewed = new Date(p.last_reviewed)
        return lastReviewed >= today
      }).length,
      dueWords: progressList.value.filter(p => new Date(p.next_review) <= now).length,
      masteredWords: progressList.value.filter(p => p.repetitions >= 5).length
    }
  }

  // 学习会话：新增/更新当前词
  function addSessionWord(wordDetail) {
    if (!wordDetail || !wordDetail.word) return

    const word = wordDetail.word
    const index = sessionQueue.value.indexOf(word)

    sessionWordMap.value[word] = wordDetail

    if (index === -1) {
      sessionQueue.value.push(word)
      currentSessionIndex.value = sessionQueue.value.length - 1
    } else {
      currentSessionIndex.value = index
    }
  }

  // 学习会话：标记已学
  function markLearnedInSession(word) {
    if (!word) return
    if (!learnedWordsInSession.value.includes(word)) {
      learnedWordsInSession.value.push(word)
    }
  }

  // 学习会话：获取当前词详情
  function getCurrentSessionWordDetail() {
    if (currentSessionIndex.value < 0 || currentSessionIndex.value >= sessionQueue.value.length) {
      return null
    }

    const word = sessionQueue.value[currentSessionIndex.value]
    return sessionWordMap.value[word] || null
  }

  // 学习会话：回退
  function goToPreviousSessionWord() {
    if (!hasPreviousSessionWord.value) {
      return null
    }

    currentSessionIndex.value -= 1
    return getCurrentSessionWordDetail()
  }

  // 学习会话：前进
  function goToNextSessionWord() {
    if (!hasNextSessionWord.value) {
      return null
    }

    currentSessionIndex.value += 1
    return getCurrentSessionWordDetail()
  }

  // 学习会话：按单词定位
  function setCurrentSessionWord(word) {
    const index = sessionQueue.value.indexOf(word)
    if (index === -1) return null

    currentSessionIndex.value = index
    return getCurrentSessionWordDetail()
  }

  function resetStudySession() {
    sessionQueue.value = []
    sessionWordMap.value = {}
    currentSessionIndex.value = -1
    learnedWordsInSession.value = []
  }

  // 与服务器同步
  async function syncWithServer() {
    if (!userStore.user || isSyncing.value) return

    isSyncing.value = true

    try {
      // 先处理待同步队列
      await processSyncQueue()

      // 然后从服务器拉取最新数据
      await Promise.all([
        syncCollections(),
        syncProgress()
      ])

      // 保存到本地缓存
      saveToCache()
    } catch (err) {
      console.error('同步失败:', err)
    } finally {
      isSyncing.value = false
    }
  }

  // 同步收藏列表
  async function syncCollections() {
    try {
      const { data, error: err } = await collections.getCollections(userStore.user.id)
      if (err) throw err
      collectionList.value = data || []
    } catch (err) {
      console.error('同步收藏失败:', err)
    }
  }

  // 同步学习进度
  async function syncProgress() {
    try {
      const { data, error: err } = await progress.getProgress(userStore.user.id)
      if (err) throw err
      progressList.value = data || []
      calculateStats()
    } catch (err) {
      console.error('同步进度失败:', err)
    }
  }

  // 处理同步队列
  async function processSyncQueue() {
    const queue = getSyncQueue()

    for (let i = queue.length - 1; i >= 0; i--) {
      const item = queue[i]

      // 只处理当前用户的队列
      if (item.userId !== userStore.user.id) continue

      try {
        if (item.action === 'addCollection') {
          await collections.addCollection(item.userId, item.data.word)
        } else if (item.action === 'removeCollection') {
          await collections.removeCollection(item.userId, item.data.word)
        } else if (item.action === 'updateProgress') {
          await progress.updateProgress(item.userId, item.data.word, item.data.progressData)
        }

        // 成功后从队列移除
        removeFromSyncQueue(i)
      } catch (err) {
        console.error('同步队列项失败:', err)
        // 保留在队列中，下次重试
      }
    }
  }

  // 加载收藏列表（优先使用缓存）
  async function loadCollections() {
    if (!userStore.user) return

    // 先从缓存加载
    loadFromCache()

    // 后台同步
    syncWithServer()
  }

  // 添加收藏（乐观更新 + 后台同步）
  async function addCollection(word) {
    if (!userStore.user) {
      error.value = '请先登录'
      return { success: false }
    }

    // 立即更新本地状态（乐观更新）
    const newItem = {
      word,
      created_at: new Date().toISOString()
    }
    collectionList.value.unshift(newItem)

    // 保存到缓存
    saveToCache()

    // 添加到同步队列
    addToSyncQueue(userStore.user.id, 'addCollection', { word })

    // 后台同步
    setTimeout(() => {
      processSyncQueue().catch(err => {
        console.error('后台同步失败:', err)
      })
    }, 100)

    return { success: true }
  }

  // 移除收藏（乐观更新 + 后台同步）
  async function removeCollection(word) {
    if (!userStore.user) return { success: false }

    // 立即更新本地状态
    collectionList.value = collectionList.value.filter(c => c.word !== word)

    // 保存到缓存
    saveToCache()

    // 添加到同步队列
    addToSyncQueue(userStore.user.id, 'removeCollection', { word })

    // 后台同步
    setTimeout(() => {
      processSyncQueue().catch(err => {
        console.error('后台同步失败:', err)
      })
    }, 100)

    return { success: true }
  }

  // 检查是否已收藏
  function isCollected(word) {
    return collectedWords.value.includes(word)
  }

  // 加载学习进度（优先使用缓存）
  async function loadProgress() {
    if (!userStore.user) return

    // 先从缓存加载
    loadFromCache()

    // 后台同步
    syncWithServer()
  }

  // 更新单词学习进度（乐观更新 + 后台同步）
  async function updateWordProgress(word, quality) {
    if (!userStore.user) {
      error.value = '请先登录'
      return { success: false }
    }

    try {
      // 查找当前进度
      const existingProgress = progressList.value.find(p => p.word === word)

      // 计算新的复习参数
      const newData = calculateNextReview(
        existingProgress?.ease_factor || 2.5,
        existingProgress?.interval || 0,
        existingProgress?.repetitions || 0,
        quality
      )

      // 立即更新本地状态（乐观更新）
      const index = progressList.value.findIndex(p => p.word === word)
      if (index >= 0) {
        progressList.value[index] = {
          ...progressList.value[index],
          ...newData,
          last_reviewed: new Date().toISOString()
        }
      } else {
        progressList.value.push({
          word,
          user_id: userStore.user.id,
          ...newData,
          last_reviewed: new Date().toISOString()
        })
      }

      // 记入会话已学词
      markLearnedInSession(word)

      // 重新计算统计
      calculateStats()

      // 保存到缓存
      saveToCache()

      // 添加到同步队列
      addToSyncQueue(userStore.user.id, 'updateProgress', {
        word,
        progressData: newData
      })

      // 后台同步
      setTimeout(() => {
        processSyncQueue().catch(err => {
          console.error('后台同步失败:', err)
        })
      }, 100)

      return { success: true, data: newData }
    } catch (err) {
      error.value = '更新学习进度失败: ' + err.message
      console.error(err)
      return { success: false }
    }
  }

  // 加载统计数据（从本地计算，无需请求）
  async function loadStats() {
    calculateStats()
  }

  // 获取待复习单词
  async function loadDueWords() {
    if (!userStore.user) return

    // 先从缓存加载
    loadFromCache()

    // 后台同步
    syncWithServer()
  }

  // 清除错误
  function clearError() {
    error.value = null
  }

  // 清除用户数据和缓存
  function clearUserData() {
    if (userStore.user) {
      clearAllUserCache(userStore.user.id)
    }
    collectionList.value = []
    progressList.value = []
    stats.value = {
      totalWords: 0,
      learnedToday: 0,
      dueWords: 0,
      masteredWords: 0
    }
    resetStudySession()
  }

  return {
    collectionList,
    progressList,
    stats,
    dueWords,
    collectedWords,
    loading,
    error,
    isSyncing,
    sessionQueue,
    sessionWordMap,
    currentSessionIndex,
    learnedWordsInSession,
    hasPreviousSessionWord,
    hasNextSessionWord,
    addSessionWord,
    markLearnedInSession,
    getCurrentSessionWordDetail,
    goToPreviousSessionWord,
    goToNextSessionWord,
    setCurrentSessionWord,
    resetStudySession,
    loadCollections,
    addCollection,
    removeCollection,
    isCollected,
    loadProgress,
    updateWordProgress,
    loadStats,
    loadDueWords,
    syncWithServer,
    clearError,
    clearUserData
  }
})
