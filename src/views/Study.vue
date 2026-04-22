<template>
  <div class="study-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        学习模式
      </h1>
      <p class="text-sm md:text-base text-gray-600 dark:text-gray-400">
        选择单词开始学习，标记您的掌握程度
      </p>
    </div>

    <div v-if="currentLearningGoal" class="ai-goal-banner">
      <p class="ai-goal-label">AI 学习目标</p>
      <p class="ai-goal-text">{{ currentLearningGoal }}</p>
    </div>

    <!-- 主要内容区域 -->
    <div v-if="currentWord" class="study-layout">
      <aside class="session-panel">
        <div class="session-panel-card">
          <p class="session-panel-kicker">学习会话面板</p>
          <h2 class="session-panel-title">{{ currentLearningGoal ? '本轮学习目标' : '本次学习记录' }}</h2>
          <p v-if="currentLearningGoal" class="session-panel-copy">
            {{ currentLearningGoal }}
          </p>
          <p v-else class="session-panel-copy">
            当前没有 AI 计划，本面板会继续记录这次学习会话里的内容。
          </p>

          <section class="session-panel-section">
            <div class="session-panel-section-header">
              <h3>推荐词进度</h3>
              <span v-if="plannedRecommendedWords.length" class="session-panel-badge">
                {{ plannedRecommendedWordsLearned.length }} / {{ plannedRecommendedWords.length }}
              </span>
            </div>
            <ul v-if="plannedRecommendedWords.length" class="session-word-list">
              <li
                v-for="word in plannedRecommendedWords"
                :key="word"
                class="session-word-item"
              >
                <span>{{ word }}</span>
                <span class="session-word-state">
                  {{ learningStore.learnedWordsInSession.includes(word) ? '已学' : '待学' }}
                </span>
              </li>
            </ul>
            <p v-else class="session-panel-empty">
              暂无推荐词，先按当前学习会话继续推进。
            </p>
          </section>

          <section class="session-panel-section">
            <div class="session-panel-section-header">
              <h3>已学词</h3>
              <span class="session-panel-badge">{{ learningStore.learnedWordsInSession.length }}</span>
            </div>
            <ul v-if="learningStore.learnedWordsInSession.length" class="session-word-list compact">
              <li
                v-for="word in learningStore.learnedWordsInSession"
                :key="word"
                class="session-word-item"
              >
                <span>{{ word }}</span>
              </li>
            </ul>
            <p v-else class="session-panel-empty">
              还没有已学词，先完成当前单词的掌握度打分。
            </p>
          </section>

          <div class="session-panel-actions">
            <router-link
              v-if="canStartQuiz"
              to="/study/quiz"
              class="btn btn-primary"
            >
              开始测试
            </router-link>
            <button
              v-else
              class="btn btn-outline opacity-50 cursor-not-allowed"
              disabled
              title="先学习再测试"
            >
              开始测试
            </button>
            <router-link to="/coach" class="btn btn-outline">
              返回 AI 教练
            </router-link>
          </div>
        </div>
      </aside>

      <div class="study-main-column">
        <div class="main-content">
          <!-- 左侧：单词信息区域 -->
          <div class="word-section">
            <!-- 单词显示 -->
            <div class="word-display">
              <div class="word-title">{{ currentWord.word }}</div>
              <div v-if="currentPhonetic" class="word-phonetic">{{ currentPhonetic }}</div>
              <div v-else-if="phoneticLoading" class="phonetic-loading">
                <div class="loading-spinner"></div>
                <span>加载音标中...</span>
              </div>
              <!-- 简洁定义（模糊点击显示） -->
              <div
                v-if="currentWord.concise_definition"
                class="concise-definition-wrapper"
                @click="showConciseDefinition = !showConciseDefinition"
              >
                <div
                  :class="[
                    'concise-definition-text',
                    showConciseDefinition ? 'revealed' : 'blurred'
                  ]"
                >
                  {{ currentWord.concise_definition }}
                </div>
                <div class="concise-definition-hint">
                  {{ showConciseDefinition ? '点击隐藏' : '点击显示简洁定义' }}
                </div>
              </div>
            </div>

            <!-- 发音和收藏按钮 -->
            <div class="action-buttons">
              <SpeakerButton
                :word="currentWord.word"
                :text="currentWord.word"
                :lang="'en'"
                :speed="1.0"
                class="speaker-btn"
              />
              <button
                v-if="userStore.isAuthenticated"
                @click="toggleCollection"
                :class="[
                  'collection-btn',
                  isCollected ? 'collected' : 'not-collected'
                ]"
              >
                {{ isCollected ? '⭐ 已收藏' : '☆ 收藏' }}
              </button>
              <p v-else class="login-hint">登录后可收藏单词</p>
            </div>

            <div class="session-navigation">
              <button
                class="btn btn-outline text-sm"
                :disabled="!learningStore.hasPreviousSessionWord"
                @click="goToPreviousWord"
              >
                上一个单词
              </button>
              <button
                class="btn btn-primary text-sm"
                @click="goToNextWord"
              >
                下一个单词
              </button>
            </div>

            <!-- 掌握程度选择（桌面端） -->
            <div class="quality-selection-desktop">
              <h3 class="quality-title">您对这个单词的掌握程度是？</h3>

              <div class="quality-buttons">
                <button
                  v-for="(option, index) in qualityOptions"
                  :key="option.value"
                  @click="markWord(option.value)"
                  :class="[
                    'quality-btn',
                    `quality-${option.color}`,
                    submitting && 'disabled'
                  ]"
                  :disabled="submitting"
                >
                  <div class="quality-icon">{{ option.icon }}</div>
                  <div class="quality-label">{{ option.label }}</div>
                  <div class="quality-desc">{{ option.description }}</div>
                </button>
              </div>
            </div>
          </div>

          <!-- 右侧：释义区域 -->
          <div class="definition-section">
            <div v-if="!showDefinition" class="definition-placeholder">
              <button @click="showDefinition = true" class="show-definition-btn">
                📖 查看释义
              </button>
            </div>
            <div v-else class="definition-content">
              <div class="definition-header">
                <h3 class="definition-title">{{ currentWord.word }} 的释义</h3>
                <button @click="showDefinition = false" class="hide-definition-btn">
                  隐藏释义
                </button>
              </div>
              <div class="definition-body">
                <div v-for="(def, index) in currentWord.definitions" :key="index" class="definition-item">
                  <div class="part-of-speech">{{ def.pos }}</div>
                  <div class="definition-section-item">
                    <div class="definition-label">英文解释：</div>
                    <div class="definition-text-en">{{ def.explanation_en }}</div>
                  </div>
                  <div class="definition-section-item">
                    <div class="definition-label">中文解释：</div>
                    <div class="definition-text-cn">{{ def.explanation_cn }}</div>
                  </div>
                  <div v-if="def.example_en" class="example">
                    <div class="example-en">{{ def.example_en }}</div>
                    <div class="example-cn">{{ def.example_cn }}</div>
                  </div>
                </div>

                <!-- 词形变化 -->
                <div v-if="currentWord.forms && Object.keys(currentWord.forms).length > 0" class="forms-section">
                  <h4 class="forms-title">词形变化</h4>
                  <div class="forms-list">
                    <div
                      v-for="(value, key) in currentWord.forms"
                      :key="key"
                      class="form-item"
                    >
                      <span class="form-label">{{ key }}</span>
                      <span class="form-value">{{ value }}</span>
                    </div>
                  </div>
                </div>

                <!-- 相似词辨析 -->
                <div v-if="currentWord.comparison && currentWord.comparison.length > 0" class="comparison-section">
                  <h4 class="comparison-title">相似词辨析</h4>
                  <div class="comparison-list">
                    <div
                      v-for="(comp, index) in currentWord.comparison"
                      :key="index"
                      class="comparison-item"
                    >
                      <div class="comparison-header">
                        <span class="comparison-word">{{ currentWord.word }}</span>
                        <span class="comparison-vs">vs</span>
                        <span class="comparison-compare">{{ comp.word_to_compare }}</span>
                      </div>
                      <div class="comparison-analysis">{{ comp.analysis }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 移动端固定底部掌握程度选择 -->
    <div v-if="currentWord" class="quality-selection-mobile">
      <div class="mobile-quality-header">
        <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">
          掌握程度
        </h3>
      </div>
      <div class="mobile-quality-buttons">
        <button
          v-for="(option, index) in qualityOptions"
          :key="option.value"
          @click="markWord(option.value)"
          :class="[
            'mobile-quality-btn',
            option.color === 'red' && 'mobile-quality-red',
            option.color === 'yellow' && 'mobile-quality-yellow',
            option.color === 'green' && 'mobile-quality-green',
            submitting && 'opacity-50 cursor-not-allowed'
          ]"
          :disabled="submitting"
        >
          <div class="mobile-quality-icon">{{ option.icon }}</div>
          <div class="mobile-quality-label">{{ option.label }}</div>
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-state">
      <div class="text-4xl mb-4">⏳</div>
      <p class="text-gray-600 dark:text-gray-400">加载中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="error-state">
      <div class="text-4xl mb-4">❌</div>
      <p class="text-red-600 dark:text-red-400 mb-4">{{ error }}</p>
      <button @click="loadStudyWord" class="btn btn-primary">
        重试
      </button>
    </div>

    <!-- 学习进度 -->
    <div v-if="learnedCount > 0" class="progress-section">
      <p class="text-sm md:text-base text-gray-600 dark:text-gray-400">
        本次已学习 <span class="text-xl md:text-2xl font-bold text-primary-600 dark:text-primary-400">{{ learnedCount }}</span> 个单词
      </p>
      <button @click="goToNextWord" class="btn btn-primary mt-3 md:mt-4 text-sm md:text-base">
        继续学习
      </button>
      <router-link
        v-if="canStartQuiz"
        to="/study/quiz"
        class="btn btn-outline mt-3 ml-0 md:ml-2 text-sm md:text-base"
      >
        开始测试
      </router-link>
      <button
        v-else
        class="btn btn-outline mt-3 ml-0 md:ml-2 text-sm md:text-base opacity-50 cursor-not-allowed"
        disabled
        title="先学习再测试"
      >
        开始测试
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import SpeakerButton from '@/components/SpeakerButton.vue'
import { useDictionaryStore } from '@/stores/dictionary'
import { useAICoachStore } from '@/stores/aiCoach'
import { useLearningStore } from '@/stores/learning'
import { useUserStore } from '@/stores/user'
import { simpleQualityOptions } from '@/utils/sm2'
import { getPhonetic } from '@/utils/phonetic'
import {
  canStartPlannedQuiz,
  getLearnedRecommendedWords,
  getNextRecommendedWord,
  mergeRecommendedWords,
} from '@/utils/learning-workflow'

const dictionaryStore = useDictionaryStore()
const aiCoachStore = useAICoachStore()
const learningStore = useLearningStore()
const userStore = useUserStore()

const currentWord = ref(null)
const loading = ref(false)
const error = ref(null)
const submitting = ref(false)
const learnedCount = ref(0)
const showDefinition = ref(false)
const showConciseDefinition = ref(false)
const currentPhonetic = ref('')
const phoneticLoading = ref(false)
const invalidRecommendedWords = ref([])

const qualityOptions = simpleQualityOptions
const plannedRecommendedWords = computed(() =>
  mergeRecommendedWords(
    aiCoachStore.dailyPlan && Array.isArray(aiCoachStore.dailyPlan.recommendedWords)
      ? aiCoachStore.dailyPlan.recommendedWords
      : aiCoachStore.recommendedWords,
    []
  )
)
const currentLearningGoal = computed(() => aiCoachStore.currentLearningGoal || '')
const plannedRecommendedWordsLearned = computed(() =>
  getLearnedRecommendedWords(
    plannedRecommendedWords.value,
    learningStore.learnedWordsInSession
  )
)
const plannedRecommendedWordsMinimum = computed(() =>
  plannedRecommendedWords.value.length > 0 ? Math.max(1, Math.min(plannedRecommendedWords.value.length, 5)) : 0
)
const canStartQuiz = computed(() => {
  if (aiCoachStore.isPlannedStudyActive) {
    return aiCoachStore.activeRun?.currentStage === 'quiz_ready'
  }

  return learningStore.learnedWordsInSession.length > 0
})

const isCollected = computed(() => {
  if (!currentWord.value) return false
  return learningStore.isCollected(currentWord.value.word)
})

function resetWordPanels() {
  showDefinition.value = false
  showConciseDefinition.value = false
}

async function applyWord(wordData, { trackInSession = true } = {}) {
  if (!wordData) return

  currentWord.value = wordData
  if (trackInSession) {
    learningStore.addSessionWord(wordData)
  }
  resetWordPanels()
  await fetchPhonetic()
}

async function loadWordByText(word) {
  const wordData = await dictionaryStore.getWordDetail(word)
  if (!wordData) {
    return false
  }

  await applyWord(wordData, { trackInSession: true })
  return true
}

// 获取音标
async function fetchPhonetic() {
  if (!currentWord.value) return

  phoneticLoading.value = true
  try {
    const phonetic = await getPhonetic(currentWord.value.word, currentWord.value.pronunciation)
    currentPhonetic.value = phonetic
  } catch (err) {
    console.error('获取音标失败:', err)
    currentPhonetic.value = currentWord.value.pronunciation || ''
  } finally {
    phoneticLoading.value = false
  }
}

async function loadRecommendedWord() {
  while (true) {
    const candidateWord = getNextRecommendedWord(
      plannedRecommendedWords.value,
      learningStore.sessionQueue,
      invalidRecommendedWords.value
    )

    if (!candidateWord) {
      return false
    }

    const loaded = await loadWordByText(candidateWord)
    if (loaded) {
      return true
    }

    invalidRecommendedWords.value = [...invalidRecommendedWords.value, candidateWord]
  }
}

async function loadFallbackRandomWord() {
  const words = await dictionaryStore.loadRandomWords(1)
  if (!words || words.length === 0) {
    error.value = '无法加载单词'
    return
  }

  const loaded = await loadWordByText(words[0].word)
  if (!loaded) {
    error.value = '无法加载单词详情'
  }
}

// 优先加载 AI 推荐词，没有时回退随机单词
async function loadStudyWord() {
  loading.value = true
  error.value = null
  resetWordPanels()

  try {
    const loadedRecommendedWord = await loadRecommendedWord()
    if (!loadedRecommendedWord) {
      await loadFallbackRandomWord()
    }
  } catch (err) {
    error.value = '加载单词失败: ' + err.message
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function goToPreviousWord() {
  const previousWord = learningStore.goToPreviousSessionWord()
  if (!previousWord) return

  loading.value = true
  error.value = null
  try {
    await applyWord(previousWord, { trackInSession: false })
  } catch (err) {
    error.value = '加载上一个单词失败: ' + err.message
  } finally {
    loading.value = false
  }
}

async function goToNextWord() {
  const nextWord = learningStore.goToNextSessionWord()
  if (!nextWord) {
    await loadStudyWord()
    return
  }

  loading.value = true
  error.value = null
  try {
    await applyWord(nextWord, { trackInSession: false })
  } catch (err) {
    error.value = '加载下一个单词失败: ' + err.message
  } finally {
    loading.value = false
  }
}

// 标记单词
async function markWord(quality) {
  if (!currentWord.value || submitting.value) return

  submitting.value = true

  // 本会话已学记录（不依赖登录）
  learningStore.markLearnedInSession(currentWord.value.word)

  // 如果已登录，保存学习进度
  if (userStore.isAuthenticated) {
    const result = await learningStore.updateWordProgress(currentWord.value.word, quality)
    if (!result.success) {
      console.error('保存学习进度失败')
    }
  }

  if (
    plannedRecommendedWordsMinimum.value > 0 &&
    canStartPlannedQuiz({
      recommendedWords: plannedRecommendedWords.value,
      learnedWords: learningStore.learnedWordsInSession,
      minimum: plannedRecommendedWordsMinimum.value,
    })
  ) {
    await aiCoachStore.markPlanTaskDone('study', {
      learnedWords: plannedRecommendedWordsLearned.value,
      minimum: plannedRecommendedWordsMinimum.value,
    })
  }

  learnedCount.value++
  submitting.value = false

  // 加载下一个单词（优先会话中的下一个）
  setTimeout(() => {
    goToNextWord()
  }, 300)
}

// 切换收藏状态
async function toggleCollection() {
  if (!currentWord.value || !userStore.isAuthenticated) return

  if (isCollected.value) {
    await learningStore.removeCollection(currentWord.value.word)
  } else {
    await learningStore.addCollection(currentWord.value.word)
  }
}

// 键盘快捷键处理
function handleKeyPress(e) {
  if (submitting.value) return

  // 数字键 1-3 对应掌握程度
  if (e.key >= '1' && e.key <= '3') {
    e.preventDefault()
    const qualityIndex = parseInt(e.key, 10) - 1
    if (qualityIndex < qualityOptions.length) {
      markWord(qualityOptions[qualityIndex].value)
    }
  }
}

onMounted(() => {
  if (plannedRecommendedWords.value.length > 0) {
    aiCoachStore.startPlannedStudy()
  }
  loadStudyWord()
  window.addEventListener('keydown', handleKeyPress)
})

watch(plannedRecommendedWords, (words) => {
  invalidRecommendedWords.value = invalidRecommendedWords.value.filter(word => words.includes(word))
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
})
</script>
<style scoped>
/* 主容器 */
.study-container {
  min-height: 100vh;
  padding-bottom: 120px; /* 为移动端固定底部留出空间 */
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: clamp(1rem, 3vw, 2rem);
  padding: 0 clamp(0.5rem, 2vw, 1rem);
}

.ai-goal-banner {
  max-width: 900px;
  margin: 0 auto 1.5rem;
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.95), rgba(239, 246, 255, 0.9));
  border: 1px solid rgba(96, 165, 250, 0.35);
}

.dark .ai-goal-banner {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.96), rgba(15, 23, 42, 0.92));
  border-color: rgba(96, 165, 250, 0.28);
}

.ai-goal-label {
  margin: 0 0 0.35rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2563eb;
}

.dark .ai-goal-label {
  color: #93c5fd;
}

.ai-goal-text {
  margin: 0;
  font-size: clamp(0.95rem, 2vw, 1.05rem);
  line-height: 1.6;
  color: #1e3a8a;
}

.dark .ai-goal-text {
  color: #e0f2fe;
}

.study-layout {
  display: grid;
  gap: 1.25rem;
  max-width: 1480px;
  margin: 0 auto;
  padding: 0 clamp(0.5rem, 2vw, 1rem);
}

.study-main-column {
  min-width: 0;
}

.session-panel {
  min-width: 0;
}

.session-panel-card {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 1.25rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
  border: 1px solid rgba(148, 163, 184, 0.28);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
}

.dark .session-panel-card {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.95));
  border-color: rgba(96, 165, 250, 0.22);
  box-shadow: none;
}

.session-panel-kicker {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2563eb;
}

.dark .session-panel-kicker {
  color: #93c5fd;
}

.session-panel-title {
  margin: 0;
  font-size: 1.3rem;
  color: #111827;
}

.dark .session-panel-title {
  color: #f8fafc;
}

.session-panel-copy,
.session-panel-empty {
  margin: 0;
  color: #4b5563;
  line-height: 1.6;
}

.dark .session-panel-copy,
.dark .session-panel-empty {
  color: #cbd5e1;
}

.session-panel-section {
  display: grid;
  gap: 0.75rem;
  padding-top: 0.25rem;
}

.session-panel-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.session-panel-section-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #1f2937;
}

.dark .session-panel-section-header h3 {
  color: #f8fafc;
}

.session-panel-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.4rem;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  font-size: 0.82rem;
  font-weight: 700;
}

.dark .session-panel-badge {
  background: rgba(96, 165, 250, 0.18);
  color: #bfdbfe;
}

.session-word-list {
  display: grid;
  gap: 0.55rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.session-word-list.compact {
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
}

.session-word-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.9rem;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.24);
  color: #111827;
}

.dark .session-word-item {
  background: rgba(15, 23, 42, 0.55);
  border-color: rgba(148, 163, 184, 0.18);
  color: #e5e7eb;
}

.session-word-state {
  font-size: 0.8rem;
  color: #2563eb;
  font-weight: 600;
}

.dark .session-word-state {
  color: #93c5fd;
}

.session-panel-actions {
  display: grid;
  gap: 0.75rem;
}

/* 主要内容区域 - 响应式左右布局 */
.main-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(1rem, 4vw, 3rem);
  max-width: none;
  margin: 0;
  padding: 0;
}

@media (min-width: 768px) {
  .main-content {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1200px) {
  .study-layout {
    grid-template-columns: minmax(0, 2.2fr) minmax(300px, 360px);
    align-items: start;
  }

  .session-panel {
    order: 2;
  }

  .session-panel-card {
    position: sticky;
    top: 1.5rem;
  }
}

/* 左侧单词区域 */
.word-section {
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 3vw, 2rem);
  justify-content: center;
  min-height: 60vh;
}

/* 单词显示 */
.word-display {
  text-align: center;
  margin-bottom: clamp(1rem, 3vw, 2rem);
}

.word-title {
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: bold;
  color: #1f2937;
  margin-bottom: clamp(0.5rem, 2vw, 1rem);
  line-height: 1.2;
}

.dark .word-title {
  color: #f9fafb;
}

.word-phonetic {
  font-size: clamp(1rem, 3vw, 1.5rem);
  color: #6b7280;
  font-family: 'Courier New', monospace;
  margin-bottom: clamp(0.5rem, 2vw, 1rem);
}

.dark .word-phonetic {
  color: #9ca3af;
}

.phonetic-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  color: #6b7280;
}

.dark .phonetic-loading {
  color: #9ca3af;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 简洁定义（模糊点击显示） */
.concise-definition-wrapper {
  margin-top: clamp(1rem, 3vw, 1.5rem);
  cursor: pointer;
  transition: all 0.3s;
}

.concise-definition-wrapper:hover {
  transform: translateY(-2px);
}

.concise-definition-text {
  padding: clamp(0.75rem, 2vw, 1rem);
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  line-height: 1.6;
  color: #1e40af;
  border-left: 4px solid #3b82f6;
  transition: all 0.3s;
  user-select: none;
}

.dark .concise-definition-text {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
  border-left-color: #60a5fa;
}

.concise-definition-text.blurred {
  filter: blur(8px);
  cursor: pointer;
}

.concise-definition-text.revealed {
  filter: blur(0);
  cursor: text;
  user-select: text;
}

.concise-definition-hint {
  margin-top: clamp(0.5rem, 1.5vw, 0.75rem);
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  color: #6b7280;
  text-align: center;
  font-style: italic;
  transition: all 0.3s;
}

.dark .concise-definition-hint {
  color: #9ca3af;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.75rem, 2vw, 1rem);
  margin-bottom: clamp(1rem, 3vw, 2rem);
}

.speaker-btn {
  padding: clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem);
  font-size: clamp(0.875rem, 2.5vw, 1rem);
}

.collection-btn {
  padding: clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem);
  border-radius: 8px;
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  font-weight: 500;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.collection-btn.collected {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.collection-btn.not-collected {
  background: transparent;
  color: #6b7280;
  border-color: #d1d5db;
}

.dark .collection-btn.not-collected {
  color: #9ca3af;
  border-color: #4b5563;
}

.collection-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.login-hint {
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  color: #6b7280;
  text-align: center;
}

.dark .login-hint {
  color: #9ca3af;
}

/* 桌面端掌握程度选择 */
.quality-selection-desktop {
  display: none;
}

@media (min-width: 768px) {
  .quality-selection-desktop {
    display: block;
  }
}

.quality-title {
  font-size: clamp(1rem, 3vw, 1.25rem);
  font-weight: 600;
  color: #1f2937;
  text-align: center;
  margin-bottom: clamp(1rem, 3vw, 1.5rem);
}

.dark .quality-title {
  color: #f9fafb;
}

.quality-buttons {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(0.75rem, 2vw, 1rem);
}

@media (min-width: 640px) {
  .quality-buttons {
    grid-template-columns: repeat(3, 1fr);
  }
}

.quality-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(1rem, 3vw, 1.5rem);
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.2s;
  cursor: pointer;
}

.quality-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.quality-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quality-btn.quality-red {
  background: #fef2f2;
  border-color: #fecaca;
}

.quality-btn.quality-yellow {
  background: #fffbeb;
  border-color: #fed7aa;
}

.quality-btn.quality-green {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.dark .quality-btn.quality-red {
  background: rgba(220, 38, 38, 0.1);
  border-color: rgba(220, 38, 38, 0.3);
}

.dark .quality-btn.quality-yellow {
  background: rgba(217, 119, 6, 0.1);
  border-color: rgba(217, 119, 6, 0.3);
}

.dark .quality-btn.quality-green {
  background: rgba(22, 163, 74, 0.1);
  border-color: rgba(22, 163, 74, 0.3);
}

.quality-icon {
  font-size: clamp(1.5rem, 4vw, 2rem);
  margin-bottom: clamp(0.5rem, 1.5vw, 0.75rem);
}

.quality-label {
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  font-weight: 600;
  margin-bottom: clamp(0.25rem, 1vw, 0.5rem);
}

.quality-btn.quality-red .quality-label {
  color: #dc2626;
}

.quality-btn.quality-yellow .quality-label {
  color: #d97706;
}

.quality-btn.quality-green .quality-label {
  color: #16a34a;
}

.dark .quality-btn.quality-red .quality-label {
  color: #fca5a5;
}

.dark .quality-btn.quality-yellow .quality-label {
  color: #fbbf24;
}

.dark .quality-btn.quality-green .quality-label {
  color: #4ade80;
}

.quality-desc {
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  text-align: center;
  line-height: 1.4;
}

.quality-btn.quality-red .quality-desc {
  color: #dc2626;
}

.quality-btn.quality-yellow .quality-desc {
  color: #d97706;
}

.quality-btn.quality-green .quality-desc {
  color: #16a34a;
}

.dark .quality-btn.quality-red .quality-desc {
  color: #fca5a5;
}

.dark .quality-btn.quality-yellow .quality-desc {
  color: #fbbf24;
}

.dark .quality-btn.quality-green .quality-desc {
  color: #4ade80;
}

/* 右侧释义区域 */
.definition-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: fit-content;
  max-height: 80vh;
}

.dark .definition-section {
  background: #1f2937;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.definition-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: clamp(1rem, 3vw, 2rem);
}

.show-definition-btn {
  padding: clamp(0.75rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem);
  font-size: clamp(1rem, 3vw, 1.25rem);
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.show-definition-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.definition-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: clamp(1rem, 3vw, 1.5rem);
  overflow: hidden;
}

.definition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(1rem, 3vw, 1.5rem);
  padding-bottom: clamp(0.5rem, 2vw, 1rem);
  border-bottom: 1px solid #e5e7eb;
}

.dark .definition-header {
  border-bottom-color: #374151;
}

.definition-title {
  font-size: clamp(1rem, 3vw, 1.25rem);
  font-weight: 600;
  color: #1f2937;
}

.dark .definition-title {
  color: #f9fafb;
}

.hide-definition-btn {
  padding: clamp(0.25rem, 1vw, 0.5rem) clamp(0.75rem, 2vw, 1rem);
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .hide-definition-btn {
  color: #9ca3af;
  border-color: #4b5563;
}

.hide-definition-btn:hover {
  background: #f3f4f6;
}

.dark .hide-definition-btn:hover {
  background: #374151;
}

.definition-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.definition-item {
  margin-bottom: clamp(1rem, 3vw, 1.5rem);
  padding-bottom: clamp(0.75rem, 2vw, 1rem);
  border-bottom: 1px solid #f3f4f6;
}

.dark .definition-item {
  border-bottom-color: #374151;
}

.definition-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.part-of-speech {
  display: inline-block;
  background: #3b82f6;
  color: white;
  padding: clamp(0.125rem, 1vw, 0.25rem) clamp(0.5rem, 2vw, 0.75rem);
  border-radius: 9999px;
  font-size: clamp(0.625rem, 2vw, 0.75rem);
  font-weight: 600;
  margin-bottom: clamp(0.25rem, 1vw, 0.5rem);
}

.definition-section-item {
  margin-bottom: clamp(0.75rem, 2vw, 1rem);
}

.definition-label {
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  color: #6b7280;
  margin-bottom: clamp(0.25rem, 1vw, 0.5rem);
}

.dark .definition-label {
  color: #9ca3af;
}

.definition-text-en {
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  line-height: 1.6;
  color: #6b7280;
  margin-bottom: clamp(0.5rem, 2vw, 0.75rem);
}

.dark .definition-text-en {
  color: #9ca3af;
}

.definition-text-cn {
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  line-height: 1.6;
  color: #374151;
  font-weight: 500;
}

.dark .definition-text-cn {
  color: #d1d5db;
}

.example {
  background: #f9fafb;
  padding: clamp(0.5rem, 2vw, 0.75rem);
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.dark .example {
  background: #374151;
}

.example-en {
  font-style: italic;
  color: #6b7280;
  margin-bottom: clamp(0.125rem, 1vw, 0.25rem);
  font-size: clamp(0.75rem, 2vw, 0.875rem);
}

.dark .example-en {
  color: #9ca3af;
}

.example-cn {
  color: #374151;
  font-weight: 500;
  font-size: clamp(0.75rem, 2vw, 0.875rem);
}

.dark .example-cn {
  color: #d1d5db;
}

/* 词形变化 */
.forms-section {
  margin-top: clamp(1.5rem, 4vw, 2rem);
  padding-top: clamp(1rem, 3vw, 1.5rem);
  border-top: 1px solid #e5e7eb;
}

.dark .forms-section {
  border-top-color: #374151;
}

.forms-title {
  font-size: clamp(1rem, 3vw, 1.125rem);
  font-weight: 600;
  color: #1f2937;
  margin-bottom: clamp(0.75rem, 2vw, 1rem);
}

.dark .forms-title {
  color: #f9fafb;
}

.forms-list {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(0.5rem, 1.5vw, 0.75rem);
}

.form-item {
  display: flex;
  align-items: center;
  padding: clamp(0.375rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem);
  background: #f3f4f6;
  border-radius: 6px;
  font-size: clamp(0.75rem, 2vw, 0.875rem);
}

.dark .form-item {
  background: #374151;
}

.form-label {
  color: #6b7280;
  margin-right: clamp(0.25rem, 1vw, 0.5rem);
}

.dark .form-label {
  color: #9ca3af;
}

.form-value {
  color: #1f2937;
  font-weight: 500;
}

.dark .form-value {
  color: #f9fafb;
}

/* 相似词辨析 */
.comparison-section {
  margin-top: clamp(1.5rem, 4vw, 2rem);
  padding-top: clamp(1rem, 3vw, 1.5rem);
  border-top: 1px solid #e5e7eb;
}

.dark .comparison-section {
  border-top-color: #374151;
}

.comparison-title {
  font-size: clamp(1rem, 3vw, 1.125rem);
  font-weight: 600;
  color: #1f2937;
  margin-bottom: clamp(0.75rem, 2vw, 1rem);
}

.dark .comparison-title {
  color: #f9fafb;
}

.comparison-list {
  display: flex;
  flex-direction: column;
  gap: clamp(0.75rem, 2vw, 1rem);
}

.comparison-item {
  padding: clamp(0.75rem, 2vw, 1rem);
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.dark .comparison-item {
  background: #374151;
}

.comparison-header {
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1.5vw, 0.75rem);
  margin-bottom: clamp(0.5rem, 1.5vw, 0.75rem);
  font-size: clamp(0.875rem, 2.5vw, 1rem);
}

.comparison-word {
  font-weight: 600;
  color: #1f2937;
}

.dark .comparison-word {
  color: #f9fafb;
}

.comparison-vs {
  color: #6b7280;
  font-weight: 500;
}

.dark .comparison-vs {
  color: #9ca3af;
}

.comparison-compare {
  font-weight: 600;
  color: #3b82f6;
}

.dark .comparison-compare {
  color: #60a5fa;
}

.comparison-analysis {
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  line-height: 1.6;
  color: #374151;
}

.dark .comparison-analysis {
  color: #d1d5db;
}

/* 移动端固定底部掌握程度选择 */
.quality-selection-mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: clamp(0.75rem, 2vw, 1rem);
  z-index: 50;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
}

.dark .quality-selection-mobile {
  background: #1f2937;
  border-top-color: #374151;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.3);
}

@media (min-width: 768px) {
  .quality-selection-mobile {
    display: none;
  }
}

.mobile-quality-header {
  text-align: center;
  margin-bottom: clamp(0.5rem, 1.5vw, 0.75rem);
}

.mobile-quality-header h3 {
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  font-weight: 600;
  color: #1f2937;
}

.dark .mobile-quality-header h3 {
  color: #f9fafb;
}

.mobile-quality-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(0.25rem, 1vw, 0.5rem);
}

.mobile-quality-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(0.5rem, 2vw, 0.75rem) clamp(0.25rem, 1vw, 0.5rem);
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s;
  font-size: clamp(0.75rem, 2vw, 0.875rem);
}

.mobile-quality-red {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.mobile-quality-yellow {
  background: #fffbeb;
  border-color: #fed7aa;
  color: #d97706;
}

.mobile-quality-green {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #16a34a;
}

.mobile-quality-icon {
  font-size: clamp(1rem, 3vw, 1.25rem);
  margin-bottom: clamp(0.125rem, 1vw, 0.25rem);
}

.mobile-quality-label {
  font-weight: 600;
  font-size: clamp(0.625rem, 2vw, 0.75rem);
}

/* 状态区域 */
.loading-state,
.error-state {
  text-align: center;
  padding: clamp(3rem, 8vw, 5rem) clamp(0.5rem, 2vw, 1rem);
}

.progress-section {
  text-align: center;
  padding: clamp(1rem, 3vw, 2rem) clamp(0.5rem, 2vw, 1rem);
  background: white;
  border-radius: 12px;
  margin: clamp(1rem, 3vw, 2rem) clamp(0.5rem, 2vw, 1rem);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.dark .progress-section {
  background: #1f2937;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

/* 滚动条样式 */
.definition-body::-webkit-scrollbar {
  width: 6px;
}

.definition-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.dark .definition-body::-webkit-scrollbar-track {
  background: #374151;
}

.definition-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.dark .definition-body::-webkit-scrollbar-thumb {
  background: #6b7280;
}

.definition-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.dark .definition-body::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
