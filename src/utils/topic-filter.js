const STRONG_KEYWORDS = [
  'computer',
  'software',
  'hardware',
  'programming',
  'algorithm',
  'database',
  'server',
  'client',
  'api',
  'protocol',
  'cpu',
  'gpu',
  'cache',
  'compiler',
  'debug',
  'deployment',
  'frontend',
  'backend',
  'cloud',
  'linux',
  'kernel',
  '计算机',
  '编程',
  '算法',
  '数据库',
  '服务器',
  '客户端',
  '协议',
  '缓存',
  '编译',
  '调试',
  '前端',
  '后端',
  '云计算',
  '操作系统',
  '处理器'
]

const WEAK_KEYWORDS = [
  'data',
  'memory',
  'code',
  'coding',
  'network',
  'internet',
  'process',
  'thread',
  'script',
  'model',
  'function',
  'object',
  'class',
  'platform',
  'language',
  '数据',
  '内存',
  '代码',
  '网络',
  '线程',
  '进程',
  '脚本',
  '函数',
  '对象',
  '平台'
]

const NEGATIVE_PATTERNS = [
  'ability to remember',
  'recollection',
  'remember past events',
  '记忆力',
  '回忆',
  '回想',
  '纪念',
  '记住'
]

function toText(entry = {}) {
  const word = typeof entry.word === 'string' ? entry.word : ''
  const definition = typeof entry.definition === 'string' ? entry.definition : ''
  return `${word} ${definition}`.toLowerCase()
}

export function isComputerRelatedEntry(entry = {}) {
  const text = toText(entry)

  if (!text.trim()) {
    return false
  }

  const strongHits = STRONG_KEYWORDS.filter((keyword) => text.includes(keyword.toLowerCase())).length
  if (strongHits > 0) {
    return true
  }

  const weakHits = WEAK_KEYWORDS.filter((keyword) => text.includes(keyword.toLowerCase())).length
  if (weakHits === 0) {
    return false
  }

  const hasNegative = NEGATIVE_PATTERNS.some((keyword) => text.includes(keyword.toLowerCase()))
  if (hasNegative && weakHits < 2) {
    return false
  }

  return weakHits >= 2
}

export function pickRandomWords(words = [], count = 1) {
  const normalizedCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
  const pool = Array.isArray(words) ? [...words] : []
  const selected = []

  while (pool.length > 0 && selected.length < normalizedCount) {
    const randomIndex = Math.floor(Math.random() * pool.length)
    selected.push(pool[randomIndex])
    pool.splice(randomIndex, 1)
  }

  return selected
}
