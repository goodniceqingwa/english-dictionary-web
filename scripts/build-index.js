/**
 * 构建轻量级索引文件
 * 只包含单词列表和基本信息，不包含完整内容
 * 单词详情按需从原始文件加载
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { isComputerRelatedEntry } from '../src/utils/topic-filter.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const WORDS_DIR = path.join(__dirname, '../public/dictionary')
const OUTPUT_FILE = path.join(__dirname, '../public/dictionary/index.json')
const TOPIC_DIR = path.join(__dirname, '../public/dictionary/topics')

function normalizeWord(data, fileName) {
  return (data.word || fileName.replace('.json', '')).trim()
}

function buildIndexDefinition(data) {
  if (data.concise_definition) {
    return data.concise_definition
  }

  const firstDef = data.definitions?.[0]
  if (!firstDef) {
    return ''
  }

  return [firstDef.explanation_cn, firstDef.explanation_en].filter(Boolean).join(' / ')
}

function buildTopicDefinition(data) {
  const parts = []

  if (data.concise_definition) {
    parts.push(data.concise_definition)
  }

  if (Array.isArray(data.definitions)) {
    data.definitions.forEach((item) => {
      parts.push(item.pos || '')
      parts.push(item.explanation_en || '')
      parts.push(item.explanation_cn || '')
    })
  }

  return parts.filter(Boolean).join(' ')
}

export function buildComputerTopicWords(wordList) {
  return [...new Set(
    wordList
      .filter((item) => item && item.word)
      .filter((item) => isComputerRelatedEntry(item))
      .map((item) => item.word)
  )].sort((a, b) => a.localeCompare(b))
}

export function buildIndexFiles({ wordsDir = WORDS_DIR, outputFile = OUTPUT_FILE, topicDir = TOPIC_DIR } = {}) {
  const files = fs.readdirSync(wordsDir).filter((file) => file.endsWith('.json') && file !== 'index.json')

  const wordList = []
  const groups = {}
  const topicCandidates = []

  for (const file of files) {
    try {
      const filePath = path.join(wordsDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(content)

      const word = normalizeWord(data, file)
      if (!word) {
        continue
      }

      const firstChar = word.charAt(0).toLowerCase()
      const groupKey = /[a-z]/.test(firstChar) ? firstChar : 'other'

      const basicInfo = {
        word,
        pronunciation: data.pronunciation || '',
        definition: buildIndexDefinition(data)
      }

      wordList.push(basicInfo)

      topicCandidates.push({
        word,
        definition: buildTopicDefinition(data)
      })

      if (!groups[groupKey]) {
        groups[groupKey] = 0
      }
      groups[groupKey] += 1
    } catch (err) {
      console.warn(`⚠️  处理 ${file} 失败:`, err.message)
    }
  }

  wordList.sort((a, b) => a.word.localeCompare(b.word))

  const index = {
    version: '2.1',
    totalWords: wordList.length,
    groups: Object.keys(groups).sort(),
    groupCounts: groups,
    words: wordList,
    buildTime: new Date().toISOString(),
    dataSource: 'dictionary'
  }

  const computerWords = buildComputerTopicWords(topicCandidates)
  const computerTopic = {
    topic: 'computer',
    version: '1.0',
    buildTime: new Date().toISOString(),
    count: computerWords.length,
    words: computerWords
  }

  fs.writeFileSync(outputFile, JSON.stringify(index, null, 2), 'utf-8')
  fs.mkdirSync(topicDir, { recursive: true })
  fs.writeFileSync(path.join(topicDir, 'computer.json'), JSON.stringify(computerTopic, null, 2), 'utf-8')

  return {
    index,
    computerTopic,
    fileCount: files.length
  }
}

export function runBuild() {
  console.log('📚 开始构建轻量级索引...')

  const { index, computerTopic, fileCount } = buildIndexFiles()

  console.log(`找到 ${fileCount} 个单词文件`)
  console.log('\n✅ 索引构建完成！')
  console.log(`📊 总单词数: ${index.totalWords}`)
  console.log(`📁 索引文件: ${OUTPUT_FILE}`)
  console.log(`💾 文件大小: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`)
  console.log(`🧠 计算机主题词数: ${computerTopic.count}`)
  console.log(`📁 主题文件: ${path.join(TOPIC_DIR, 'computer.json')}`)
  console.log('\n💡 提示：单词详情将从 dictionary/[word].json 按需加载')
}

if (path.resolve(process.argv[1] || '') === __filename) {
  runBuild()
}
