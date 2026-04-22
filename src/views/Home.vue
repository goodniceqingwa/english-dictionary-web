<template>
  <div class="max-w-4xl mx-auto">
    <!-- Hero Section -->
    <div class="text-center mb-12">
      <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        智能英汉词典
      </h1>
      <p class="text-xl text-gray-600 dark:text-gray-400 mb-8">
        基于记忆曲线的科学学习方法，高效记忆单词
      </p>

      <!-- 搜索栏 -->
      <div class="max-w-2xl mx-auto mb-8">
        <SearchBar />
      </div>

      <!-- 统计信息 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div class="card text-center">
          <div class="text-3xl font-bold text-primary-600 dark:text-primary-400">
            {{ dictionaryStore.totalWords.toLocaleString() }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            词汇总量
          </div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-green-600 dark:text-green-400">
            {{ learningStore.stats.totalWords }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            已学单词
          </div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {{ learningStore.stats.learnedToday }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            今日学习
          </div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {{ learningStore.dueWords.length }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            待复习
          </div>
        </div>
      </div>
    </div>


    <div class="card mb-12">
      <p class="font-mono text-sm text-blue-600 dark:text-blue-300 mb-4">$ welcome --user developer</p>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-5">学习路径</h2>

      <div class="space-y-4 mb-6">
        <div>
          <div class="flex items-center justify-between text-sm mb-2">
            <span class="font-medium text-gray-700 dark:text-gray-300">Phase 1 · Shadow 跟读</span>
            <span class="text-gray-500 dark:text-gray-400">{{ formatPercent(phase1Rate) }}</span>
          </div>
          <div class="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div class="h-full bg-blue-500" :style="{ width: formatPercent(phase1Rate) }"></div>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between text-sm mb-2">
            <span class="font-medium text-gray-700 dark:text-gray-300">Phase 2 · Flashcard 记忆</span>
            <span class="text-gray-500 dark:text-gray-400">{{ formatPercent(phase2Rate) }}</span>
          </div>
          <div class="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div class="h-full bg-green-500" :style="{ width: formatPercent(phase2Rate) }"></div>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between text-sm mb-2">
            <span class="font-medium text-gray-700 dark:text-gray-300">Phase 3 · Scenario 对话（预热）</span>
            <span class="text-gray-500 dark:text-gray-400">{{ formatPercent(phase3Rate) }}</span>
          </div>
          <div class="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div class="h-full bg-purple-500" :style="{ width: formatPercent(phase3Rate) }"></div>
          </div>
        </div>
      </div>

      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">今日任务</h3>
      <div class="grid md:grid-cols-3 gap-3">
        <div
          v-for="task in dailyTasks"
          :key="task.id"
          class="rounded-lg border p-3"
          :class="task.done
            ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
            : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ task.title }}</span>
            <span>{{ task.done ? '✅' : '⬜' }}</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">进度 {{ task.progress }}</p>
        </div>
      </div>
    </div>

    <div class="card mb-12">
      <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div class="max-w-2xl">
          <p class="font-mono text-sm text-primary-600 dark:text-primary-300 mb-3">$ coach --today</p>
          <div class="flex flex-wrap items-center gap-3 mb-2">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">今日 AI 计划摘要</h2>
            <span class="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-200">
              AI 当前阶段 · {{ coachStageLabel }}
            </span>
          </div>
          <p class="text-gray-600 dark:text-gray-400 leading-7">
            {{ aiPlanSummary }}
          </p>

          <div v-if="userStore.isAuthenticated" class="grid gap-3 mt-5 sm:grid-cols-3">
            <div
              v-for="metric in coachSummaryMetrics"
              :key="metric.label"
              class="rounded-xl border border-primary-100 bg-white/80 px-4 py-3 dark:border-primary-900 dark:bg-gray-900/30"
            >
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {{ metric.label }}
              </p>
              <p class="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
                {{ metric.value }}
              </p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ metric.hint }}
              </p>
            </div>
          </div>
        </div>

        <div class="shrink-0 rounded-xl border border-primary-100 bg-primary-50/70 px-4 py-3 text-sm text-primary-700 dark:border-primary-900 dark:bg-primary-900/20 dark:text-primary-200">
          <p class="font-semibold mb-1">AI 教练会帮你整理什么？</p>
          <p>{{ coachPrimaryAction.description }}</p>
          <router-link
            v-if="userStore.isAuthenticated"
            :to="coachPrimaryAction.to"
            class="mt-3 inline-flex items-center rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
          >
            {{ coachPrimaryAction.label }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- 快速开始 -->
    <div class="grid md:grid-cols-2 xl:grid-cols-5 gap-6 mb-12">
      <router-link 
        to="/study"
        class="card hover:shadow-xl transition-shadow cursor-pointer group"
      >
        <div class="flex items-center justify-center space-x-4 w-full">
          <div class="text-5xl">📖</div>
          <div class="flex-1 text-center">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              开始学习
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              浏览词汇库，学习新单词
            </p>
          </div>
        </div>
      </router-link>

      <router-link 
        to="/study/computer"
        class="card hover:shadow-xl transition-shadow cursor-pointer group"
      >
        <div class="flex items-center justify-center space-x-4 w-full">
          <div class="text-5xl">💻</div>
          <div class="flex-1 text-center">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              计算机英语
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              聚焦计算机相关英语词汇
            </p>
          </div>
        </div>
      </router-link>

      <router-link 
        v-if="userStore.isAuthenticated"
        to="/coach"
        class="card hover:shadow-xl transition-shadow cursor-pointer group"
      >
        <div class="flex items-center justify-center space-x-4 w-full">
          <div class="text-5xl">🤖</div>
          <div class="flex-1 text-center">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              AI 学习教练
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              生成今日计划，串联画像、练习与复盘
            </p>
          </div>
        </div>
      </router-link>

      <router-link 
        v-else
        to="/auth?redirect=/coach"
        class="card hover:shadow-xl transition-shadow cursor-pointer group"
      >
        <div class="flex items-center justify-center space-x-4 w-full">
          <div class="text-5xl">🤖</div>
          <div class="flex-1 text-center">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              AI 学习教练
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              登录后生成个性化学习计划与任务建议
            </p>
          </div>
        </div>
      </router-link>

      <router-link 
        to="/shadow"
        class="card hover:shadow-xl transition-shadow cursor-pointer group"
      >
        <div class="flex items-center justify-center space-x-4 w-full">
          <div class="text-5xl">🗣️</div>
          <div class="flex-1 text-center">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              跟读训练
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              程序员场景句库，已掌握 {{ shadowStore.totalMasteredSentences }} 句
            </p>
          </div>
        </div>
      </router-link>

      <router-link 
        v-if="userStore.isAuthenticated"
        to="/review"
        class="card hover:shadow-xl transition-shadow cursor-pointer group"
      >
        <div class="flex items-center justify-center space-x-4">
          <div class="text-5xl">🔄</div>
          <div class="flex-1 text-center">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              复习单词
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              根据记忆曲线复习
            </p>
          </div>
        </div>
      </router-link>

      <div 
        v-else
        class="card opacity-50"
      >
        <div class="flex items-center space-x-4">
          <div class="text-5xl">🔄</div>
          <div class="flex-1">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              复习单词
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              请先登录
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 每日推荐 -->
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          随机单词
        </h2>
        <button 
          @click="loadRandomWords"
          :disabled="loading"
          class="btn btn-outline"
        >
          {{ loading ? '加载中...' : '换一批' }}
        </button>
      </div>

      <div v-if="loading" class="grid md:grid-cols-2 gap-4">
        <div v-for="i in 6" :key="i" class="skeleton h-24"></div>
      </div>

      <div v-else class="grid md:grid-cols-2 gap-4">
        <router-link
          v-for="word in randomWords"
          :key="word.word"
          :to="{ name: 'WordDetail', params: { word: word.word } }"
          class="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors cursor-pointer"
        >
          <div class="font-semibold text-lg text-gray-900 dark:text-gray-100">
            {{ word.word }}
            <span v-if="word.pronunciation" class="ml-2 text-sm text-gray-500 dark:text-gray-400">
              [{{ word.pronunciation }}]
            </span>
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
            {{ word.concise_definition }}
          </div>
        </router-link>
      </div>
    </div>

    <!-- 使用帮助 -->
    <div class="mt-16">
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            使用帮助
          </h2>
          <button 
            @click="showHelp = !showHelp"
            class="btn btn-outline text-sm"
          >
            {{ showHelp ? '收起' : '查看' }}
          </button>
        </div>
        
        <div v-if="showHelp" class="space-y-6">
          <!-- 学习模式快捷键 -->
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
              <span class="text-xl mr-2">⌨️</span>
              学习模式快捷键
            </h3>
            <div class="grid md:grid-cols-2 gap-4 text-sm">
              <div class="space-y-2">
                <div class="flex items-center">
                  <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono mr-3">空格</kbd>
                  <span class="text-gray-700 dark:text-gray-300">翻转单词卡片</span>
                </div>
                <div class="flex items-center">
                  <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono mr-3">Esc</kbd>
                  <span class="text-gray-700 dark:text-gray-300">返回单词面</span>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex items-center">
                  <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono mr-3">1</kbd>
                  <span class="text-gray-700 dark:text-gray-300">不认识</span>
                </div>
                <div class="flex items-center">
                  <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono mr-3">2</kbd>
                  <span class="text-gray-700 dark:text-gray-300">有点难</span>
                </div>
                <div class="flex items-center">
                  <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono mr-3">3</kbd>
                  <span class="text-gray-700 dark:text-gray-300">很简单</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 学习建议 -->
          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 class="text-lg font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
              <span class="text-xl mr-2">💡</span>
              学习建议
            </h3>
            <ul class="space-y-2 text-sm text-green-700 dark:text-green-300">
              <li class="flex items-start">
                <span class="text-green-500 mr-2">•</span>
                <span>每天坚持学习 15-30 分钟，效果最佳</span>
              </li>
              <li class="flex items-start">
                <span class="text-green-500 mr-2">•</span>
                <span>诚实评估掌握程度，系统会据此调整复习间隔</span>
              </li>
              <li class="flex items-start">
                <span class="text-green-500 mr-2">•</span>
                <span>收藏重要单词，方便重点复习</span>
              </li>
              <li class="flex items-start">
                <span class="text-green-500 mr-2">•</span>
                <span>定期查看复习页面，巩固已学单词</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能特性 -->
    <div class="mt-16">
      <h2 class="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
        为什么选择我们
      </h2>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="text-center">
          <div class="text-5xl mb-4">🧠</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            科学记忆
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            基于 SM-2 算法的记忆曲线，让复习更高效
          </p>
        </div>
        <div class="text-center">
          <div class="text-5xl mb-4">☁️</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            跨端同步
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            学习进度云端同步，随时随地继续学习
          </p>
        </div>
        <div class="text-center">
          <div class="text-5xl mb-4">🎯</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            详细释义
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            详尽的双语释义和例句，深入理解每个单词
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import { useAICoachStore } from '@/stores/aiCoach'
import { useDictionaryStore } from '@/stores/dictionary'
import { useLearningStore } from '@/stores/learning'
import { useShadowStore } from '@/stores/shadow'
import { useUserStore } from '@/stores/user'
import { getTodayQuizAttempts } from '@/utils/devspeak-stats'

const coachStore = useAICoachStore()
const dictionaryStore = useDictionaryStore()
const learningStore = useLearningStore()
const shadowStore = useShadowStore()
const userStore = useUserStore()

const randomWords = ref([])
const loading = ref(false)
const showHelp = ref(false)


const todayQuizAttempts = ref(0)

const phase1Rate = computed(() => {
  if (!shadowStore.totalSentenceCount) return 0
  return Math.min(shadowStore.totalMasteredSentences / shadowStore.totalSentenceCount, 1)
})

const phase2Rate = computed(() => Math.min(learningStore.stats.masteredWords / 120, 1))
const phase3Rate = computed(() => Math.min(todayQuizAttempts.value / 3, 1))
const coachStageLabel = computed(() => {
  const stageLabels = {
    idle: '尚未开始',
    profile_ready: '画像已保存',
    plan_ready: '计划已生成',
    studying: '学习中',
    quiz_ready: '可开始测验',
    reflecting: '复盘中',
    completed: '已完成',
  }

  return stageLabels[coachStore.activeRun?.currentStage] || '尚未开始'
})
const learnedRecommendedCount = computed(() => {
  const learnedSet = new Set(
    Array.isArray(learningStore.learnedWordsInSession)
      ? learningStore.learnedWordsInSession
      : []
  )

  return coachStore.recommendedWords.filter(word => learnedSet.has(word)).length
})
const completedCoachTaskCount = computed(() =>
  Array.isArray(coachStore.dailyPlan?.tasks)
    ? coachStore.dailyPlan.tasks.filter(task => task?.done).length
    : 0
)
const coachSummaryMetrics = computed(() => [
  {
    label: '任务完成',
    value: `${completedCoachTaskCount.value}/${Array.isArray(coachStore.dailyPlan?.tasks) ? coachStore.dailyPlan.tasks.length : 0}`,
    hint: coachStore.dailyPlan?.tasks?.length ? '本轮计划任务' : '等待生成计划',
  },
  {
    label: '推荐词进度',
    value: `${learnedRecommendedCount.value}/${coachStore.recommendedWords.length || 0}`,
    hint: coachStore.recommendedWords.length ? '本轮已学推荐词' : '暂无推荐词',
  },
  {
    label: '下一步',
    value: coachStageLabel.value,
    hint: coachStore.reflection?.summary ? '本轮已有复盘摘要' : '按阶段继续推进',
  },
])
const coachPrimaryAction = computed(() => {
  if (!userStore.isAuthenticated) {
    return {
      label: '登录后开始',
      to: '/auth?redirect=/coach',
      description: '登录后即可让 AI 教练基于你的学习目标生成计划并继续推进学习闭环。',
    }
  }

  const stage = coachStore.activeRun?.currentStage || 'idle'
  if (stage === 'quiz_ready') {
    return {
      label: '开始学习测验',
      to: '/study/quiz',
      description: '已达到测验条件，下一步进入学习测试完成答题和批改。',
    }
  }

  if (stage === 'reflecting') {
    return {
      label: '返回 AI 教练',
      to: '/coach',
      description: '测验已经完成，回到教练页整理复盘摘要和下一步建议。',
    }
  }

  if (stage === 'plan_ready' || stage === 'studying') {
    return {
      label: stage === 'studying' ? '继续学习' : '进入学习模式',
      to: '/study',
      description: '计划已经就绪，下一步去学习页推进推荐词和计划任务。',
    }
  }

  if (stage === 'completed') {
    return {
      label: '查看 AI 教练',
      to: '/coach',
      description: '这一轮已经结束，可以查看复盘结果或生成下一轮计划。',
    }
  }

  return {
    label: '生成今日计划',
    to: '/coach',
    description: '学习目标、今日任务和复盘提醒都会集中在教练页中。',
  }
})

function getFirstPlanGoalText(goals) {
  if (!Array.isArray(goals) || goals.length === 0) {
    return ''
  }

  const firstGoal = goals[0]
  if (typeof firstGoal === 'string') {
    return firstGoal.trim()
  }

  if (firstGoal && typeof firstGoal === 'object') {
    return [firstGoal.title, firstGoal.summary, firstGoal.focus, firstGoal.text]
      .find((value) => typeof value === 'string' && value.trim())
      ?.trim() || ''
  }

  return ''
}

const aiPlanSummary = computed(() => {
  if (!userStore.isAuthenticated) {
    return '登录后即可让 AI 教练基于你的学习目标生成今日计划、练习重点和复盘提醒。'
  }

  if (typeof coachStore.dailyPlan === 'string' && coachStore.dailyPlan.trim()) {
    return coachStore.dailyPlan.trim()
  }

  if (coachStore.dailyPlan && typeof coachStore.dailyPlan === 'object') {
    const structuredSummary = [
      coachStore.dailyPlan.sessionTitle,
      coachStore.dailyPlan.focus,
      coachStore.dailyPlan.summary,
      getFirstPlanGoalText(coachStore.dailyPlan.goals)
    ].find((value) => typeof value === 'string' && value.trim())

    if (structuredSummary) {
      return structuredSummary.trim()
    }
  }

  if (coachStore.profile?.goal) {
    return `当前优先聚焦“${coachStore.profile.goal}”，进入教练页即可继续生成今天的专属安排。`
  }

  return '今天还没有生成 AI 计划，进入教练页后可以快速整理目标、任务和下一步建议。'
})

const dailyTasks = computed(() => [
  {
    id: 'shadow',
    title: '跟读 3 句工作表达',
    progress: `${shadowStore.todayMasteredCount}/3`,
    done: shadowStore.todayMasteredCount >= 3
  },
  {
    id: 'words',
    title: '学习 10 个单词',
    progress: `${learningStore.stats.learnedToday}/10`,
    done: learningStore.stats.learnedToday >= 10
  },
  {
    id: 'quiz',
    title: '完成 1 次学习测试',
    progress: `${todayQuizAttempts.value}/1`,
    done: todayQuizAttempts.value >= 1
  }
])

function formatPercent(rate) {
  return `${Math.round(rate * 100)}%`
}

function refreshDashboardStats() {
  todayQuizAttempts.value = getTodayQuizAttempts()
}


async function loadRandomWords() {
  loading.value = true
  await dictionaryStore.loadRandomWords(6)
  randomWords.value = dictionaryStore.randomWords
  loading.value = false
}

onMounted(() => {
  loadRandomWords()
  refreshDashboardStats()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

kbd {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  color: #374151;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);
}

.dark kbd {
  color: #d1d5db;
  background-color: #374151;
  border-color: #4b5563;
}
</style>
