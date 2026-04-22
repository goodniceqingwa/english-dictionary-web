<template>
  <div class="ai-coach-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">AI Coach</p>
        <h1>AI 学习教练</h1>
      </div>
      <p class="page-summary">
        在这里保存学习画像、生成今日计划，并把计划继续串到学习和复盘流程里。
      </p>
    </header>

    <div v-if="statusMessage" class="status-banner">
      {{ statusMessage }}
    </div>

    <section v-if="coachStore.dailyPlan || coachStore.activeRun || coachStore.reflection" class="summary-strip">
      <div class="summary-card">
        <div class="section-heading">
          <h2>本轮完成度摘要</h2>
          <p>用任务完成度、推荐词进度和下一步建议快速判断这轮学习还差什么。</p>
        </div>

        <div class="summary-metrics">
          <div v-for="metric in summaryMetrics" :key="metric.label" class="summary-metric">
            <span class="summary-metric-label">{{ metric.label }}</span>
            <strong class="summary-metric-value">{{ metric.value }}</strong>
            <span class="summary-metric-hint">{{ metric.hint }}</span>
          </div>
        </div>

        <div class="summary-next-step">
          <span class="content-label">下一步建议</span>
          <strong>{{ primaryAction.label }}</strong>
          <p>{{ primaryAction.description }}</p>
        </div>
      </div>
    </section>

    <div class="coach-grid">
      <section class="card section-card">
        <div class="section-heading">
          <h2>学习画像表单</h2>
          <p>先采集目标、当前水平和本周学习安排，后续会用于驱动真实教练流程。</p>
        </div>

        <form class="profile-form" @submit.prevent="handleSaveProfile">
          <label>
            <span>学习目标</span>
            <input v-model.trim="profileForm.goal" type="text" placeholder="例如：提升技术面试表达" />
          </label>

          <label>
            <span>当前水平</span>
            <input v-model.trim="profileForm.level" type="text" placeholder="例如：A2 / 能读文档但口语偏弱" />
          </label>

          <label>
            <span>每周投入</span>
            <input v-model.trim="profileForm.weeklyHours" type="text" placeholder="例如：5 小时" />
          </label>

          <label>
            <span>本阶段重点</span>
            <textarea
              v-model.trim="profileForm.focus"
              rows="4"
              placeholder="例如：standup、代码讲解、英文复盘"
            ></textarea>
          </label>

          <button type="submit" class="action-button primary-button">
            保存画像
          </button>
        </form>
      </section>

      <section class="card section-card">
        <div class="section-heading">
          <h2>今日计划卡片</h2>
          <p>这里会展示 AI 教练生成的当日学习计划和相关练习入口。</p>
        </div>

        <div v-if="coachStore.dailyPlan" class="content-card">
          <h3>{{ coachStore.dailyPlan.sessionTitle || '今日学习计划' }}</h3>
          <p v-if="coachStore.dailyPlan.coachTip" class="content-copy">
            {{ coachStore.dailyPlan.coachTip }}
          </p>

          <div v-if="coachStore.dailyPlan.goals?.length" class="content-section">
            <p class="content-label">学习目标</p>
            <ul class="detail-list">
              <li v-for="goal in coachStore.dailyPlan.goals" :key="goal">
                {{ goal }}
              </li>
            </ul>
          </div>

          <div v-if="coachStore.dailyPlan.tasks?.length" class="content-section">
            <p class="content-label">任务拆解</p>
            <ul class="task-list">
              <li v-for="task in coachStore.dailyPlan.tasks" :key="task.title || task.taskType" class="task-item">
                <div class="task-item-row">
                  <strong>{{ task.title || task.taskType }}</strong>
                  <div class="task-meta">
                    <span class="task-state">{{ task.done ? '已完成' : '待完成' }}</span>
                    <span class="task-type">{{ task.taskType || 'task' }}</span>
                  </div>
                </div>
                <p>{{ task.instructions }}</p>
              </li>
            </ul>
          </div>

          <div v-if="coachStore.dailyPlan.recommendedWords?.length" class="content-section">
            <p class="content-label">推荐词</p>
            <div class="chip-row">
              <span v-for="word in coachStore.dailyPlan.recommendedWords" :key="word" class="word-chip">
                {{ word }}
              </span>
            </div>
          </div>
        </div>
        <p v-else class="placeholder-copy">
          暂无今日计划，先保存画像后生成一轮计划。
        </p>

        <div class="button-row">
          <button class="action-button primary-button" type="button" :disabled="!canGeneratePlan" @click="handleGeneratePlan">
            生成今日计划
          </button>
          <router-link
            v-if="coachStore.dailyPlan"
            to="/study"
            class="action-button primary-button ghost-link-button"
          >
            进入学习模式
          </router-link>
          <button class="action-button" type="button" :disabled="!canGenerateQuiz" @click="handleGenerateQuiz">
            生成练习测验
          </button>
        </div>

        <div v-if="coachStore.quizRequest" class="content-card">
          <h3>当前测验上下文</h3>
          <p>已学单词：{{ coachStore.quizRequest.learnedWords.join('、') || '暂无' }}</p>
          <p>计划任务：{{ coachStore.quizRequest.planTasks.join('、') || '暂无' }}</p>
        </div>
      </section>

      <section class="card section-card">
        <div class="section-heading">
          <h2>当前阶段进度</h2>
          <p>后续这里会展示真实教练运行状态、执行阶段和关键提示。</p>
        </div>

        <div v-if="coachStore.activeRun" class="content-card">
          <h3>当前工作流</h3>
          <div class="progress-step-list">
            <div
              v-for="step in stageProgressSteps"
              :key="step.key"
              :class="['progress-step', `progress-step-${step.state}`]"
            >
              <span class="progress-step-dot"></span>
              <div class="progress-step-copy">
                <strong>{{ step.label }}</strong>
                <span>{{ step.stateLabel }}</span>
              </div>
            </div>
          </div>
          <div class="progress-metric">
            <span class="content-label">阶段</span>
            <strong>{{ stageLabels[coachStore.activeRun?.currentStage] || coachStore.activeRun?.currentStage || '未开始' }}</strong>
          </div>
          <div class="progress-metric">
            <span class="content-label">状态</span>
            <strong>{{ statusLabels[coachStore.activeRun?.status] || coachStore.activeRun?.status || 'idle' }}</strong>
          </div>
          <div v-if="coachStore.activeRun?.runId" class="progress-metric">
            <span class="content-label">Run ID</span>
            <code>{{ coachStore.activeRun.runId }}</code>
          </div>
          <div v-if="coachStore.activeRun?.recommendedWords?.length" class="content-section">
            <p class="content-label">计划词队列</p>
            <div class="chip-row">
              <span v-for="word in coachStore.activeRun.recommendedWords" :key="word" class="word-chip">
                {{ word }}
              </span>
            </div>
          </div>
          <div class="button-row">
            <router-link
              v-if="primaryAction.to"
              :to="primaryAction.to"
              class="action-button primary-button ghost-link-button"
            >
              {{ primaryAction.label }}
            </router-link>
            <button
              v-else
              type="button"
              class="action-button primary-button"
              :disabled="primaryAction.disabled"
              @click="handlePrimaryAction"
            >
              {{ primaryAction.label }}
            </button>
          </div>
        </div>
        <p v-else class="placeholder-copy">
          当前没有进行中的教练任务，进度数据尚未接入。
        </p>
      </section>

      <section class="card section-card">
        <div class="section-heading">
          <h2>复盘结果区</h2>
          <p>后续这里会展示学习复盘、AI 总结和下一步建议。</p>
        </div>

        <label class="reflection-input">
          <span>今日观察</span>
          <textarea
            v-model.trim="reflectionNotes"
            rows="5"
            placeholder="例如：能跟上 standup 开场，但解释阻塞点时仍然卡顿"
          ></textarea>
        </label>

        <button class="action-button primary-button" type="button" :disabled="!canSummarizeReflection" @click="handleSummarizeReflection">
          整理复盘摘要
        </button>

        <div v-if="coachStore.quizResults" class="content-card">
          <h3>最近一次测验</h3>
          <p>正确率：{{ coachStore.quizResults.accuracy }}%</p>
          <p>答对：{{ coachStore.quizResults.correctCount }} / {{ coachStore.quizResults.totalCount }}</p>
          <ul v-if="coachStore.quizResults.wrongAnswers.length" class="detail-list">
            <li v-for="item in coachStore.quizResults.wrongAnswers" :key="`${item.title}-${item.correctAnswer}`">
              {{ item.title }}：你的答案 {{ item.userAnswer || '（空）' }}；正确答案 {{ item.correctAnswer || '暂无' }}
            </li>
          </ul>
        </div>

        <div v-if="coachStore.reflection" class="content-card">
          <h3>AI 复盘摘要</h3>
          <p>{{ coachStore.reflection.summary }}</p>
          <p v-if="coachStore.reflection.notes">补充观察：{{ coachStore.reflection.notes }}</p>
          <ul v-if="coachStore.reflection.blockers.length" class="detail-list">
            <li v-for="item in coachStore.reflection.blockers" :key="item">
              {{ item }}
            </li>
          </ul>
          <ul v-if="coachStore.reflection.nextActions.length" class="detail-list">
            <li v-for="item in coachStore.reflection.nextActions" :key="item">
              {{ item }}
            </li>
          </ul>
        </div>
        <p v-else class="placeholder-copy">
          暂无复盘结果。复盘摘要能力将在后续任务中接入。
        </p>
      </section>

      <section class="card section-card">
        <div class="section-heading">
          <h2>工作流日志</h2>
          <p>开发期可直接查看这轮计划、测验与复盘事件，方便定位请求和状态问题。</p>
        </div>

        <div v-if="coachStore.runEvents.length" class="log-list">
          <article v-for="event in coachStore.runEvents" :key="event.id || `${event.eventType}-${event.createdAt}`" class="log-item">
            <div class="log-item-header">
              <strong>{{ formatEventType(event.eventType || event.event_type) }}</strong>
              <span class="log-item-status">{{ event.status || 'unknown' }}</span>
            </div>
            <p class="log-item-time">{{ formatEventTime(event.createdAt || event.created_at) }}</p>
            <details class="log-payload" v-if="event.inputJson || event.input_json || event.outputJson || event.output_json">
              <summary>查看输入 / 输出</summary>
              <div v-if="event.inputJson || event.input_json" class="log-payload-block">
                <span class="content-label">Input</span>
                <pre>{{ formatEventPayload(event.inputJson || event.input_json) }}</pre>
              </div>
              <div v-if="event.outputJson || event.output_json" class="log-payload-block">
                <span class="content-label">Output</span>
                <pre>{{ formatEventPayload(event.outputJson || event.output_json) }}</pre>
              </div>
            </details>
          </article>
        </div>
        <p v-else class="placeholder-copy">
          当前还没有可展示的工作流事件。
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useAICoachStore } from '@/stores/aiCoach'
import { useLearningStore } from '@/stores/learning'

const coachStore = useAICoachStore()
const learningStore = useLearningStore()

const stageLabels = {
  idle: '尚未开始',
  profile_ready: '画像已保存',
  plan_ready: '计划已生成',
  studying: '学习中',
  quiz_ready: '可开始测验',
  reflecting: '复盘中',
  completed: '已完成',
}

const statusLabels = {
  idle: '空闲',
  active: '进行中',
  plan_ready: '计划就绪',
  quiz_ready: '测验就绪',
  reflecting: '整理复盘',
  completed: '已完成',
}

const profileForm = reactive({
  goal: '',
  level: '',
  weeklyHours: '',
  focus: ''
})

const reflectionNotes = ref('')
const statusMessage = ref('')
const currentStage = computed(() => coachStore.activeRun?.currentStage || 'idle')
const canGeneratePlan = computed(() => !['studying', 'quiz_ready', 'reflecting'].includes(currentStage.value))
const canGenerateQuiz = computed(() => currentStage.value === 'quiz_ready')
const canSummarizeReflection = computed(() => currentStage.value === 'reflecting')
const learnedWordSource = computed(() => {
  if (Array.isArray(learningStore.learnedWordsInSession) && learningStore.learnedWordsInSession.length > 0) {
    return learningStore.learnedWordsInSession.filter(Boolean)
  }

  return Array.isArray(coachStore.quizResults?.learnedWords)
    ? coachStore.quizResults.learnedWords.filter(Boolean)
    : []
})
const learnedRecommendedCount = computed(() => {
  const learnedSet = new Set(learnedWordSource.value)
  return coachStore.recommendedWords.filter(word => learnedSet.has(word)).length
})
const completedTaskCount = computed(() =>
  Array.isArray(coachStore.dailyPlan?.tasks)
    ? coachStore.dailyPlan.tasks.filter(task => task?.done).length
    : 0
)
const totalTaskCount = computed(() =>
  Array.isArray(coachStore.dailyPlan?.tasks)
    ? coachStore.dailyPlan.tasks.length
    : 0
)
const stageProgressSteps = computed(() => {
  const order = ['profile_ready', 'plan_ready', 'studying', 'quiz_ready', 'reflecting', 'completed']
  const currentIndex = order.indexOf(currentStage.value)

  return order.map((key, index) => {
    let state = 'upcoming'
    if (currentIndex === -1 && key === 'profile_ready') {
      state = 'current'
    } else if (index < currentIndex) {
      state = 'done'
    } else if (index === currentIndex) {
      state = 'current'
    }

    return {
      key,
      label: stageLabels[key],
      state,
      stateLabel: state === 'done' ? '已完成' : state === 'current' ? '当前阶段' : '待开始',
    }
  })
})
const primaryAction = computed(() => {
  if (currentStage.value === 'quiz_ready') {
    return {
      label: '开始学习测验',
      to: '/study/quiz',
      disabled: false,
      description: '本轮学习已达到测验条件，进入学习测试完成答题和批改。',
    }
  }

  if (currentStage.value === 'reflecting') {
    return {
      label: '整理复盘摘要',
      action: 'reflect',
      disabled: !canSummarizeReflection.value,
      description: '基于刚完成的测验结果生成总结、阻塞项和下一步建议。',
    }
  }

  if (['plan_ready', 'studying'].includes(currentStage.value)) {
    return {
      label: currentStage.value === 'studying' ? '继续学习' : '进入学习模式',
      to: '/study',
      disabled: false,
      description: currentStage.value === 'studying'
        ? '继续推进本轮推荐词和计划任务，完成后即可进入测验。'
        : '计划已经就绪，进入学习页开始推进推荐词和任务。',
    }
  }

  return {
    label: currentStage.value === 'completed' ? '生成下一轮计划' : '生成今日计划',
    action: 'plan',
    disabled: !canGeneratePlan.value,
    description: currentStage.value === 'completed'
      ? '这一轮已经结束，可以基于新的状态生成下一轮计划。'
      : '先生成计划，再进入学习、测验和复盘闭环。',
  }
})
const summaryMetrics = computed(() => [
  {
    label: '任务完成',
    value: `${completedTaskCount.value}/${totalTaskCount.value || 0}`,
    hint: totalTaskCount.value ? '已完成任务数' : '等待生成计划',
  },
  {
    label: '推荐词进度',
    value: `${learnedRecommendedCount.value}/${coachStore.recommendedWords.length || 0}`,
    hint: coachStore.recommendedWords.length ? '本轮已学推荐词' : '暂无推荐词',
  },
  {
    label: '当前阶段',
    value: stageLabels[currentStage.value] || '尚未开始',
    hint: primaryAction.value.label,
  },
])

async function handleSaveProfile() {
  await coachStore.saveProfile({ ...profileForm })
  statusMessage.value = '画像信息已保存，可继续生成今日计划。'
}

async function handleGeneratePlan() {
  if (!canGeneratePlan.value) {
    statusMessage.value = '当前学习流程进行中，请先完成本轮学习、测验或复盘。'
    return
  }

  const plan = await coachStore.generateDailyPlan()
  statusMessage.value = plan
    ? '已生成今日计划，可直接进入学习模式。'
    : '今日计划生成失败，请稍后重试。'
}

async function handleGenerateQuiz() {
  if (!canGenerateQuiz.value) {
    statusMessage.value = '当前还不能生成测验，请先完成学习阶段。'
    return
  }

  await coachStore.generateQuiz({
    learnedWords: coachStore.quizResults?.learnedWords || coachStore.recommendedWords,
    planTasks: coachStore.planTasks,
  })
  statusMessage.value = '已整理测验上下文，可继续到学习测验页完成答题。'
}

async function handleSummarizeReflection() {
  if (!canSummarizeReflection.value) {
    statusMessage.value = '当前还不能整理复盘，请先完成一次可同步的测验。'
    return
  }

  const reflection = await coachStore.summarizeReflection({ notes: reflectionNotes.value })
  statusMessage.value = reflection
    ? '已基于现有测验结果整理复盘摘要。'
    : '当前阶段还不能生成复盘摘要，请先完成一次可同步的测验。'
}

async function handlePrimaryAction() {
  if (primaryAction.value.action === 'reflect') {
    await handleSummarizeReflection()
    return
  }

  await handleGeneratePlan()
}

function formatEventType(eventType = '') {
  const labels = {
    generate_daily_plan: '生成今日计划',
    generate_quiz: '生成测验',
    summarize_reflection: '整理复盘',
  }

  return labels[eventType] || eventType || '未知事件'
}

function formatEventTime(value) {
  if (!value) {
    return '时间未知'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatEventPayload(value) {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
</script>

<style scoped>
.ai-coach-page {
  display: grid;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: end;
}

.eyebrow {
  margin: 0 0 0.4rem;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #2563eb;
  font-weight: 700;
}

.page-header h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 2.75rem);
  color: #111827;
}

.page-summary {
  max-width: 34rem;
  margin: 0;
  color: #4b5563;
  line-height: 1.6;
}

.status-banner {
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  background: #eff6ff;
  color: #1d4ed8;
  line-height: 1.6;
}

.summary-strip {
  display: grid;
}

.summary-card {
  display: grid;
  gap: 1rem;
  padding: 1.35rem 1.5rem;
  border-radius: 1.25rem;
  background: linear-gradient(135deg, #eff6ff, #f8fafc);
  border: 1px solid #bfdbfe;
}

.summary-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.85rem;
}

.summary-metric {
  display: grid;
  gap: 0.3rem;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(191, 219, 254, 0.85);
}

.summary-metric-label {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #475569;
}

.summary-metric-value {
  font-size: 1.4rem;
  color: #0f172a;
}

.summary-metric-hint {
  font-size: 0.88rem;
  color: #64748b;
}

.summary-next-step {
  display: grid;
  gap: 0.35rem;
  padding-top: 0.2rem;
}

.summary-next-step strong {
  color: #0f172a;
}

.summary-next-step p {
  margin: 0;
  color: #334155;
  line-height: 1.6;
}

.log-list {
  display: grid;
  gap: 0.75rem;
}

.log-item {
  padding: 0.9rem 1rem;
  border-radius: 0.95rem;
  background: #f8fafc;
  border: 1px solid #dbe4f0;
}

.log-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.log-item-status {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #2563eb;
}

.log-item-time {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.88rem;
}

.log-payload {
  margin-top: 0.65rem;
}

.log-payload summary {
  cursor: pointer;
  color: #2563eb;
  font-size: 0.88rem;
  font-weight: 600;
}

.log-payload-block {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.75rem;
}

.log-payload-block pre {
  margin: 0;
  padding: 0.85rem;
  border-radius: 0.85rem;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 0.8rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.coach-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.section-card {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
}

.section-heading h2 {
  margin: 0 0 0.4rem;
  font-size: 1.2rem;
  color: #111827;
}

.section-heading p,
.placeholder-copy {
  margin: 0;
  color: #6b7280;
  line-height: 1.6;
}

.profile-form,
.reflection-input {
  display: grid;
  gap: 0.9rem;
}

.profile-form label,
.reflection-input {
  display: grid;
  gap: 0.45rem;
}

.profile-form span,
.reflection-input span {
  font-size: 0.92rem;
  font-weight: 600;
  color: #374151;
}

.profile-form input,
.profile-form textarea,
.reflection-input textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.85rem;
  padding: 0.85rem 1rem;
  font: inherit;
  resize: vertical;
  background: #ffffff;
  color: #111827;
  box-sizing: border-box;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.action-button {
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  padding: 0.75rem 1.1rem;
  background: #f8fafc;
  color: #0f172a;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.action-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.primary-button {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border-color: #1d4ed8;
  color: #ffffff;
}

.content-card {
  padding: 1rem;
  border-radius: 1rem;
  background: #f8fafc;
  color: #111827;
}

.content-card h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.content-copy {
  margin: 0;
  color: #334155;
  line-height: 1.6;
}

.content-section {
  display: grid;
  gap: 0.55rem;
  margin-top: 1rem;
}

.content-label {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #475569;
}

.task-list {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.task-item {
  padding: 0.85rem 0.95rem;
  border-radius: 0.9rem;
  background: #ffffff;
  border: 1px solid #dbe4f0;
}

.task-item p {
  margin: 0.4rem 0 0;
  color: #334155;
  line-height: 1.6;
}

.task-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.task-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.task-state {
  font-size: 0.78rem;
  font-weight: 700;
  color: #047857;
}

.task-type {
  font-size: 0.78rem;
  font-weight: 700;
  color: #2563eb;
  text-transform: uppercase;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.word-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.88rem;
  font-weight: 600;
}

.progress-metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid #dbe4f0;
}

.progress-metric:last-of-type {
  border-bottom: none;
}

.progress-step-list {
  display: grid;
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.9rem;
  border: 1px solid #dbe4f0;
  background: #ffffff;
}

.progress-step-dot {
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 999px;
  background: #cbd5e1;
  flex: none;
}

.progress-step-copy {
  display: grid;
  gap: 0.15rem;
}

.progress-step-copy strong {
  font-size: 0.92rem;
  color: #0f172a;
}

.progress-step-copy span {
  font-size: 0.8rem;
  color: #64748b;
}

.progress-step-done {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.progress-step-done .progress-step-dot {
  background: #16a34a;
}

.progress-step-current {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.progress-step-current .progress-step-dot {
  background: #2563eb;
}

.ghost-link-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.detail-list {
  margin: 0.75rem 0 0;
  padding-left: 1.2rem;
  color: #334155;
  line-height: 1.6;
}

@media (max-width: 640px) {
  .section-card,
  .status-banner {
    padding: 1.1rem;
  }

  .button-row,
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
