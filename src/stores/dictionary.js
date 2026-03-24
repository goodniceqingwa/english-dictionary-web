import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as dict from '@/utils/dictionary'

export const useDictionaryStore = defineStore('dictionary', () => {
  const index = ref(null)
  const currentWord = ref(null)
  const searchResults = ref([])
  const randomWords = ref([])
  const loading = ref(false)
  const error = ref(null)

  const totalWords = computed(() => index.value?.totalWords || 0)

  // 初始化索引
  async function initIndex() {
    if (index.value) return

    loading.value = true
    error.value = null
    try {
      index.value = await dict.loadIndex()
      // 后台预加载常用单词（不阻塞）
      dict.preloadCommonWords()
    } catch (err) {
      error.value = '加载词典索引失败: ' + err.message
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  // 搜索单词
  async function search(query) {
    if (!query || query.trim() === '') {
      searchResults.value = []
      return
    }

    loading.value = true
    error.value = null
    try {
      searchResults.value = await dict.searchWords(query, 20)
    } catch (err) {
      error.value = '搜索失败: ' + err.message
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  // 获取单词详情
  async function getWordDetail(word) {
    loading.value = true
    error.value = null
    try {
      currentWord.value = await dict.getWordDetail(word)
      return currentWord.value
    } catch (err) {
      error.value = '获取单词详情失败: ' + err.message
      console.error(err)
      return null
    } finally {
      loading.value = false
    }
  }

  // 获取随机单词
  async function loadRandomWords(count = 10) {
    loading.value = true
    error.value = null
    try {
      randomWords.value = await dict.getRandomWords(count)
      return randomWords.value
    } catch (err) {
      error.value = '获取随机单词失败: ' + err.message
      console.error(err)
      return []
    } finally {
      loading.value = false
    }
  }

  // 获取主题随机单词
  async function loadRandomTopicWords(topic, count = 10) {
    loading.value = true
    error.value = null
    try {
      randomWords.value = await dict.getRandomTopicWords(topic, count)
      return randomWords.value
    } catch (err) {
      error.value = `获取主题单词失败(${topic}): ` + err.message
      console.error(err)
      return []
    } finally {
      loading.value = false
    }
  }

  // 清除搜索结果
  function clearSearch() {
    searchResults.value = []
  }

  // 清除错误
  function clearError() {
    error.value = null
  }

  return {
    index,
    currentWord,
    searchResults,
    randomWords,
    loading,
    error,
    totalWords,
    initIndex,
    search,
    getWordDetail,
    loadRandomWords,
    loadRandomTopicWords,
    clearSearch,
    clearError
  }
})
