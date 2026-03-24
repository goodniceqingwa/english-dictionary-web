<template>
  <div class="max-w-4xl mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">学习测试</h1>
      <p class="text-gray-600 dark:text-gray-400">基于本会话已学单词生成混合测试（选择题 + 拼写题）</p>
    </div>

    <div v-if="!hasLearnedWords" class="card text-center">
      <div class="text-5xl mb-4">📝</div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">请先学习再测试</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-5">当前会话还没有已学单词，先在学习页完成几个单词标记。</p>
      <router-link to="/study" class="btn btn-primary">返回学习模式</router-link>
    </div>

    <div v-else-if="quizCompleted" class="card">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">测试完成</h2>
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-2">
        正确 {{ correctCount }} / {{ totalCount }}
      </p>
      <p class="text-lg mb-6" :class="accuracy >= 80 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'">
        正确率 {{ accuracy }}%
      </p>

      <div v-if="wrongAnswers.length > 0" class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">错题回顾</h3>
        <div class="space-y-3">
          <div
            v-for="(item, index) in wrongAnswers"
            :key="index"
            class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          >
            <p class="text-sm text-red-800 dark:text-red-200">{{ item.title }}</p>
            <p class="text-sm text-red-700 dark:text-red-300 mt-1">你的答案：{{ item.userAnswer || '（空）' }}</p>
            <p class="text-sm text-green-700 dark:text-green-300">正确答案：{{ item.correctAnswer }}</p>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <button class="btn btn-primary" @click="restartQuiz">再测一次</button>
        <router-link class="btn btn-outline" to="/study">返回学习页</router-link>
      </div>
    </div>

    <div v-else-if="currentQuestion" class="card">
      <div class="flex items-center justify-between mb-5">
        <span class="text-sm text-gray-500 dark:text-gray-400">题目 {{ currentQuestionIndex + 1 }} / {{ totalCount }}</span>
        <span class="text-sm px-3 py-1 rounded-full" :class="currentQuestion.type === 'choice' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'">
          {{ currentQuestion.type === 'choice' ? '选择题' : '拼写题' }}
        </span>
      </div>

      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-5">{{ currentQuestion.title }}</h2>

      <div v-if="currentQuestion.type === 'choice'" class="grid sm:grid-cols-2 gap-3 mb-5">
        <button
          v-for="option in currentQuestion.options"
          :key="option"
          class="p-3 rounded-lg border-2 text-left transition-colors"
          :class="selectedOption === option
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-500'"
          @click="selectedOption = option"
        >
          {{ option }}
        </button>
      </div>

      <div v-else class="mb-5">
        <input
          v-model="spellingInput"
          type="text"
          placeholder="输入英文单词"
          class="w-full p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          @keyup.enter="submitAnswer"
        />
      </div>

      <div class="flex gap-3">
        <button class="btn btn-primary" @click="submitAnswer">提交答案</button>
        <router-link class="btn btn-outline" to="/study">返回学习页</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useLearningStore } from '@/stores/learning'
import { recordQuizAttempt } from '@/utils/devspeak-stats'

const learningStore = useLearningStore()

const currentQuestionIndex = ref(0)
const questions = ref([])
const answers = ref([])
const selectedOption = ref('')
const spellingInput = ref('')
const hasRecordedAttempt = ref(false)

const hasLearnedWords = computed(() => learningStore.learnedWordsInSession.length > 0)
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] || null)
const totalCount = computed(() => questions.value.length)
const correctCount = computed(() => answers.value.filter(item => item.correct).length)
const accuracy = computed(() => {
  if (!totalCount.value) return 0
  return Math.round((correctCount.value / totalCount.value) * 100)
})
const quizCompleted = computed(() => totalCount.value > 0 && currentQuestionIndex.value >= totalCount.value)

const wrongAnswers = computed(() =>
  answers.value
    .filter(item => !item.correct)
    .map(item => ({
      title: item.question.title,
      userAnswer: item.userAnswer,
      correctAnswer: item.question.correctAnswer
    }))
)

function normalizeAnswer(value) {
  return String(value || '').trim().toLowerCase()
}

function getChineseDefinition(wordDetail) {
  if (!wordDetail) return ''

  const fromDefinitions = Array.isArray(wordDetail.definitions)
    ? wordDetail.definitions.map(item => item.explanation_cn).filter(Boolean)
    : []

  return fromDefinitions[0] || wordDetail.concise_definition || ''
}

function shuffle(list) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function buildQuestions() {
  const learnedWordDetails = learningStore.learnedWordsInSession
    .map(word => learningStore.sessionWordMap[word])
    .filter(Boolean)

  const picked = shuffle(learnedWordDetails).slice(0, Math.min(10, learnedWordDetails.length))
  const chinesePool = learnedWordDetails.map(getChineseDefinition).filter(Boolean)

  return picked.map((wordDetail) => {
    const type = Math.random() < 0.5 ? 'choice' : 'spelling'
    const chinese = getChineseDefinition(wordDetail)

    if (type === 'choice') {
      const distractors = shuffle(chinesePool.filter(item => item && item !== chinese)).slice(0, 3)
      const options = shuffle([chinese, ...distractors])
      return {
        type: 'choice',
        title: `请选择 ${wordDetail.word} 的中文释义`,
        correctAnswer: chinese,
        options
      }
    }

    return {
      type: 'spelling',
      title: `请写出英文：${chinese}`,
      correctAnswer: wordDetail.word
    }
  })
}

function submitAnswer() {
  if (!currentQuestion.value) return

  const question = currentQuestion.value
  const userAnswer = question.type === 'choice' ? selectedOption.value : spellingInput.value

  if (!normalizeAnswer(userAnswer)) {
    return
  }

  const correct = normalizeAnswer(userAnswer) === normalizeAnswer(question.correctAnswer)

  answers.value.push({
    question,
    userAnswer,
    correct
  })

  selectedOption.value = ''
  spellingInput.value = ''
  currentQuestionIndex.value += 1
}

function restartQuiz() {
  hasRecordedAttempt.value = false
  questions.value = buildQuestions()
  answers.value = []
  currentQuestionIndex.value = 0
  selectedOption.value = ''
  spellingInput.value = ''
}

watch(quizCompleted, (completed) => {
  if (!completed || hasRecordedAttempt.value) return
  recordQuizAttempt()
  hasRecordedAttempt.value = true
})

if (hasLearnedWords.value) {
  restartQuiz()
}
</script>
