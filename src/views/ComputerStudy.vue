<template>
  <div class="max-w-6xl mx-auto pb-20">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">计算机英语学习</h1>
      <p class="text-gray-600 dark:text-gray-400">聚焦计算机相关词汇，按掌握程度持续巩固</p>
    </div>

    <div v-if="topicUnavailable" class="card text-center">
      <div class="text-5xl mb-4">🛠️</div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">计算机词库暂不可用</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-6">请先执行构建生成主题词表，或先使用通用学习模式。</p>
      <router-link to="/study" class="btn btn-primary">返回通用学习</router-link>
    </div>

    <div v-else-if="currentWord" class="grid md:grid-cols-2 gap-6">
      <div class="card">
        <div class="text-center mb-6">
          <h2 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">{{ currentWord.word }}</h2>
          <p v-if="currentPhonetic" class="text-lg text-gray-500 dark:text-gray-400 mt-2 font-mono">{{ currentPhonetic }}</p>
          <div v-else-if="phoneticLoading" class="text-sm text-gray-500 dark:text-gray-400 mt-2">加载音标中...</div>

          <div
            v-if="currentWord.concise_definition"
            class="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 cursor-pointer"
            @click="showConciseDefinition = !showConciseDefinition"
          >
            <div
              :class="[
                'text-blue-800 dark:text-blue-200 transition-all',
                showConciseDefinition ? 'blur-0' : 'blur-sm'
              ]"
            >
              {{ currentWord.concise_definition }}
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {{ showConciseDefinition ? '点击隐藏' : '点击显示简洁定义' }}
            </p>
          </div>
        </div>

        <div class="flex flex-col items-center gap-3 mb-6">
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
            :class="['btn', isCollected ? 'btn-primary' : 'btn-outline']"
          >
            {{ isCollected ? '⭐ 已收藏' : '☆ 收藏' }}
          </button>
          <p v-else class="text-sm text-gray-500 dark:text-gray-400">登录后可收藏单词</p>
        </div>

        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center mb-3">您对这个单词的掌握程度是？</h3>
          <div class="grid sm:grid-cols-3 gap-3">
            <button
              v-for="option in qualityOptions"
              :key="option.value"
              @click="markWord(option.value)"
              :disabled="submitting"
              :class="[
                'p-3 rounded-lg border-2 transition-all',
                option.color === 'red' && 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700',
                option.color === 'yellow' && 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700',
                option.color === 'green' && 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700',
                submitting && 'opacity-50 cursor-not-allowed'
              ]"
            >
              <div class="text-xl">{{ option.icon }}</div>
              <div class="font-medium text-gray-900 dark:text-gray-100">{{ option.label }}</div>
              <div class="text-xs text-gray-600 dark:text-gray-400">{{ option.description }}</div>
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{{ currentWord.word }} 的释义</h3>
          <button @click="showDefinition = !showDefinition" class="btn btn-outline text-sm">
            {{ showDefinition ? '隐藏释义' : '查看释义' }}
          </button>
        </div>

        <div v-if="showDefinition" class="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div v-for="(def, index) in currentWord.definitions" :key="index" class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div class="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">{{ def.pos }}</div>
            <div class="text-sm text-gray-700 dark:text-gray-300 mb-1"><span class="font-medium">英文：</span>{{ def.explanation_en }}</div>
            <div class="text-sm text-gray-700 dark:text-gray-300"><span class="font-medium">中文：</span>{{ def.explanation_cn }}</div>
            <div v-if="def.example_en" class="mt-2 border-l-2 border-gray-300 dark:border-gray-600 pl-3">
              <div class="text-sm italic text-gray-700 dark:text-gray-300">{{ def.example_en }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">{{ def.example_cn }}</div>
            </div>
          </div>

          <div v-if="currentWord.forms && Object.keys(currentWord.forms).length > 0" class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">词形变化</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div v-for="(value, key) in currentWord.forms" :key="key" class="flex justify-between gap-2">
                <span class="text-gray-500 dark:text-gray-400">{{ key }}</span>
                <span class="text-gray-900 dark:text-gray-100">{{ value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="card text-center">
      <div class="text-4xl mb-3">⏳</div>
      <p class="text-gray-600 dark:text-gray-400">加载中...</p>
    </div>

    <div v-else-if="error" class="card text-center">
      <div class="text-4xl mb-3">❌</div>
      <p class="text-red-600 dark:text-red-400 mb-4">{{ error }}</p>
      <button @click="loadRandomWord" class="btn btn-primary">重试</button>
    </div>

    <div v-if="learnedCount > 0 && !topicUnavailable" class="text-center mt-8">
      <p class="text-gray-600 dark:text-gray-400">
        本次已学习 <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">{{ learnedCount }}</span> 个计算机词汇
      </p>
      <button @click="loadRandomWord" class="btn btn-primary mt-3">继续学习</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SpeakerButton from '@/components/SpeakerButton.vue'
import { useDictionaryStore } from '@/stores/dictionary'
import { useLearningStore } from '@/stores/learning'
import { useUserStore } from '@/stores/user'
import { simpleQualityOptions } from '@/utils/sm2'
import { getPhonetic } from '@/utils/phonetic'

const dictionaryStore = useDictionaryStore()
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
const topicUnavailable = ref(false)

const qualityOptions = simpleQualityOptions

const isCollected = computed(() => {
  if (!currentWord.value) return false
  return learningStore.isCollected(currentWord.value.word)
})

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

async function loadRandomWord() {
  loading.value = true
  error.value = null
  showDefinition.value = false
  showConciseDefinition.value = false
  topicUnavailable.value = false

  try {
    const words = await dictionaryStore.loadRandomTopicWords('computer', 3)
    if (!words || words.length === 0) {
      topicUnavailable.value = true
      currentWord.value = null
      return
    }

    let detail = null
    for (const item of words) {
      const wordData = await dictionaryStore.getWordDetail(item.word)
      if (wordData) {
        detail = wordData
        break
      }
    }

    if (!detail) {
      error.value = '计算机词汇详情加载失败，请重试'
      currentWord.value = null
      return
    }

    currentWord.value = detail
    await fetchPhonetic()
  } catch (err) {
    error.value = '加载计算机词汇失败: ' + err.message
    currentWord.value = null
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function markWord(quality) {
  if (!currentWord.value || submitting.value) return

  submitting.value = true

  if (userStore.isAuthenticated) {
    const result = await learningStore.updateWordProgress(currentWord.value.word, quality)
    if (!result.success) {
      console.error('保存学习进度失败')
    }
  }

  learnedCount.value += 1
  submitting.value = false

  setTimeout(() => {
    loadRandomWord()
  }, 300)
}

async function toggleCollection() {
  if (!currentWord.value || !userStore.isAuthenticated) return

  if (isCollected.value) {
    await learningStore.removeCollection(currentWord.value.word)
  } else {
    await learningStore.addCollection(currentWord.value.word)
  }
}

function handleKeyPress(e) {
  if (submitting.value) return

  if (e.key >= '1' && e.key <= '3') {
    e.preventDefault()
    const qualityIndex = parseInt(e.key, 10) - 1
    if (qualityIndex < qualityOptions.length) {
      markWord(qualityOptions[qualityIndex].value)
    }
  }
}

onMounted(() => {
  loadRandomWord()
  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
})
</script>
