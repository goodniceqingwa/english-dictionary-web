<template>
  <div class="shadow-page">
    <div class="page-header">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Shadow 跟读训练
      </h1>
      <p class="text-sm md:text-base text-gray-600 dark:text-gray-400">
        聚焦程序员工作场景，先模仿，再开口。
      </p>
    </div>

    <div class="card mb-6 status-card">
      <div class="status-item">
        <div class="status-label">已掌握句子</div>
        <div class="status-value text-primary-600 dark:text-primary-400">
          {{ shadowStore.totalMasteredSentences }} / {{ shadowStore.totalSentenceCount }}
        </div>
      </div>
      <div class="status-item">
        <div class="status-label">达标场景（>=60%）</div>
        <div class="status-value text-green-600 dark:text-green-400">
          {{ shadowStore.scenesAtSixtyPercent.length }} / 3
        </div>
      </div>
      <div class="status-item">
        <div class="status-label">Phase 2 闪卡解锁</div>
        <div class="status-value" :class="shadowStore.flashcardUnlocked ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'">
          {{ shadowStore.flashcardUnlocked ? '已解锁' : '未解锁' }}
        </div>
      </div>
    </div>

    <div class="shadow-layout">
      <aside class="card scene-panel">
        <h2 class="panel-title">场景</h2>
        <div class="scene-list">
          <button
            v-for="scene in shadowStore.sceneList"
            :key="scene.id"
            @click="selectScene(scene.id)"
            class="scene-item"
            :class="{ active: scene.id === shadowStore.activeSceneId }"
          >
            <div class="scene-main">
              <div class="scene-name">{{ scene.title }}</div>
              <div class="scene-sub">{{ scene.subtitle }}</div>
            </div>
            <div class="scene-progress-text">
              {{ shadowStore.getSceneCompletion(scene.id).completed }} / {{ shadowStore.getSceneCompletion(scene.id).total }}
            </div>
            <div class="scene-progress-track">
              <div
                class="scene-progress-fill"
                :style="{ width: `${Math.round(shadowStore.getSceneCompletion(scene.id).rate * 100)}%` }"
              ></div>
            </div>
          </button>
        </div>
      </aside>

      <section v-if="activeScene && currentSentence" class="card content-panel">
        <div class="content-header">
          <div>
            <h2 class="scene-title">{{ activeScene.title }}</h2>
            <p class="scene-desc">{{ activeScene.description }}</p>
          </div>
          <div class="sentence-count">
            {{ currentSentenceIndex + 1 }} / {{ activeScene.sentences.length }}
          </div>
        </div>

        <div class="play-controls">
          <SentenceSpeaker :text="currentSentence.en" :speed="0.9" />
          <SentenceSpeaker :text="currentSentence.en" :speed="0.65" />
          <button
            class="btn btn-outline text-sm"
            :disabled="isRepeating"
            @click="repeatSentence"
          >
            {{ isRepeating ? '重复中...' : '重复播放' }}
          </button>
        </div>

        <div class="sentence-card">
          <p class="sentence-en" v-html="highlightedEnglish"></p>
          <p class="sentence-zh">{{ currentSentence.zh }}</p>
        </div>

        <div class="phrase-section">
          <div class="phrase-title">关键短语</div>
          <div class="phrase-list">
            <span
              v-for="phrase in currentSentence.phrases"
              :key="phrase"
              class="phrase-tag"
            >
              {{ phrase }}
            </span>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-outline" :disabled="!canPrev" @click="previousSentence">
            上一句
          </button>
          <button class="btn btn-primary" @click="toggleCurrentMastered">
            {{ isCurrentMastered ? '取消掌握' : '已掌握' }}
          </button>
          <button class="btn btn-outline" :disabled="!canNext" @click="nextSentence">
            下一句
          </button>
        </div>

        <div class="hint-text">
          快捷键：<kbd>←</kbd> 上一句，<kbd>→</kbd> 下一句，<kbd>M</kbd> 已掌握
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import SentenceSpeaker from '@/components/SentenceSpeaker.vue'
import { speakSentence } from '@/utils/tts'
import { useShadowStore } from '@/stores/shadow'

const shadowStore = useShadowStore()
const currentSentenceIndex = ref(0)
const isRepeating = ref(false)

const activeScene = computed(() =>
  shadowStore.sceneList.find(scene => scene.id === shadowStore.activeSceneId) || shadowStore.sceneList[0] || null
)

const currentSentence = computed(() => {
  if (!activeScene.value) return null
  return activeScene.value.sentences[currentSentenceIndex.value] || null
})

const canPrev = computed(() => currentSentenceIndex.value > 0)
const canNext = computed(() => {
  if (!activeScene.value) return false
  return currentSentenceIndex.value < activeScene.value.sentences.length - 1
})

const isCurrentMastered = computed(() => {
  if (!activeScene.value || !currentSentence.value) return false
  return shadowStore.isSentenceMastered(activeScene.value.id, currentSentence.value.id)
})

const highlightedEnglish = computed(() => {
  if (!currentSentence.value) return ''

  let result = currentSentence.value.en
  const phrases = [...currentSentence.value.phrases].sort((a, b) => b.length - a.length)

  for (const phrase of phrases) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const reg = new RegExp(escaped, 'gi')
    result = result.replace(reg, '<span class="phrase-highlight">$&</span>')
  }

  return result
})

function selectScene(sceneId) {
  shadowStore.setActiveScene(sceneId)
  currentSentenceIndex.value = 0
}

function previousSentence() {
  if (!canPrev.value) return
  currentSentenceIndex.value -= 1
}

function nextSentence() {
  if (!canNext.value) return
  currentSentenceIndex.value += 1
}

function toggleCurrentMastered() {
  if (!activeScene.value || !currentSentence.value) return
  shadowStore.toggleSentenceMastered(activeScene.value.id, currentSentence.value.id)
}

async function repeatSentence() {
  if (!currentSentence.value || isRepeating.value) return

  isRepeating.value = true

  try {
    await speakSentence(currentSentence.value.en, {
      lang: 'en-US',
      speed: 0.7
    })

    await new Promise(resolve => setTimeout(resolve, 350))

    await speakSentence(currentSentence.value.en, {
      lang: 'en-US',
      speed: 0.7
    })
  } catch (error) {
    console.warn('重复播放失败:', error)
  } finally {
    isRepeating.value = false
  }
}

function handleKeydown(event) {
  const tag = event.target?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    previousSentence()
    return
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    nextSentence()
    return
  }

  if (event.key === 'm' || event.key === 'M') {
    event.preventDefault()
    toggleCurrentMastered()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.shadow-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-card {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 0.75rem;
}

.status-item {
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 0.75rem;
  padding: 0.85rem;
}

.status-label {
  font-size: 0.85rem;
  color: #4b5563;
}

.dark .status-label {
  color: #9ca3af;
}

.status-value {
  margin-top: 0.25rem;
  font-size: 1.1rem;
  font-weight: 700;
}

.shadow-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.scene-panel {
  height: fit-content;
}

.panel-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.scene-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.scene-item {
  width: 100%;
  text-align: left;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 0.75rem;
  background: #ffffff;
  transition: all 0.2s ease;
}

.dark .scene-item {
  background: #1f2937;
  border-color: #374151;
}

.scene-item:hover {
  border-color: #3b82f6;
}

.scene-item.active {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
}

.scene-main {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
}

.scene-name {
  font-weight: 700;
  color: #111827;
}

.dark .scene-name {
  color: #f9fafb;
}

.scene-sub {
  font-size: 0.8rem;
  color: #6b7280;
}

.scene-progress-text {
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: #4b5563;
}

.dark .scene-progress-text {
  color: #9ca3af;
}

.scene-progress-track {
  margin-top: 0.4rem;
  height: 0.4rem;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}

.dark .scene-progress-track {
  background: #374151;
}

.scene-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb 0%, #10b981 100%);
}

.content-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.scene-title {
  font-size: 1.25rem;
  font-weight: 700;
}

.scene-desc {
  margin-top: 0.35rem;
  color: #6b7280;
  font-size: 0.9rem;
}

.dark .scene-desc {
  color: #9ca3af;
}

.sentence-count {
  font-size: 0.95rem;
  color: #4b5563;
  font-weight: 700;
}

.dark .sentence-count {
  color: #d1d5db;
}

.play-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.sentence-card {
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  padding: 1rem;
}

.dark .sentence-card {
  background: #111827;
  border-color: #374151;
}

.sentence-en {
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.65;
  color: #111827;
}

.dark .sentence-en {
  color: #f9fafb;
}

:deep(.phrase-highlight) {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.14);
  border-radius: 0.35rem;
  padding: 0.08rem 0.2rem;
}

.sentence-zh {
  margin-top: 0.75rem;
  font-size: 1rem;
  color: #4b5563;
}

.dark .sentence-zh {
  color: #d1d5db;
}

.phrase-section {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.phrase-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #374151;
}

.dark .phrase-title {
  color: #d1d5db;
}

.phrase-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.phrase-tag {
  font-size: 0.8rem;
  color: #1d4ed8;
  border: 1px solid rgba(29, 78, 216, 0.3);
  background: rgba(29, 78, 216, 0.07);
  border-radius: 999px;
  padding: 0.25rem 0.7rem;
}

.dark .phrase-tag {
  color: #93c5fd;
  border-color: rgba(147, 197, 253, 0.4);
  background: rgba(30, 58, 138, 0.25);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.hint-text {
  font-size: 0.85rem;
  color: #6b7280;
}

.dark .hint-text {
  color: #9ca3af;
}

kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  padding: 0.12rem 0.35rem;
  background: #f3f4f6;
}

.dark kbd {
  border-color: #4b5563;
  background: #374151;
}

@media (min-width: 1024px) {
  .status-card {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .shadow-layout {
    grid-template-columns: 320px 1fr;
  }
}
</style>
