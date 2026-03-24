# 计算机英语学习模块 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为现有词典站点新增“计算机英语专项学习”能力，自动筛选计算机词汇并在独立学习页中复用当前学习流程。

**Architecture:** 在构建阶段由 `scripts/build-index.js` 生成 `public/dictionary/topics/computer.json`；运行时由词典工具读取主题词表并随机抽词；前端通过新增 `/study/computer` 页面与导航入口接入。学习打分、收藏、快捷键继续复用现有 `learning` 与 `Study` 行为。

**Tech Stack:** Vue 3, Pinia, Vue Router, Vite, Node.js ESM scripts, node:test

---

### Task 1: 主题筛选器（纯函数）

**Files:**
- Create: `src/utils/topic-filter.js`
- Test: `tests/topic-filter.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { isComputerRelatedEntry } from '../src/utils/topic-filter.js'

test('matches programming related English keyword', () => {
  const matched = isComputerRelatedEntry({
    word: 'algorithm',
    definition: 'a process used by a computer program'
  })
  assert.equal(matched, true)
})

test('filters non-computer context with weak keywords only', () => {
  const matched = isComputerRelatedEntry({
    word: 'memory',
    definition: 'the ability to remember past events'
  })
  assert.equal(matched, false)
})
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/topic-filter.test.js`
Expected: FAIL with `isComputerRelatedEntry is not a function` 或模块不存在

**Step 3: Write minimal implementation**

```js
const POSITIVE = ['algorithm', 'database', 'server', '编程', '算法', '数据库']
const NEGATIVE = ['记忆力', '心理']

export function isComputerRelatedEntry({ word = '', definition = '' } = {}) {
  const text = `${word} ${definition}`.toLowerCase()
  if (NEGATIVE.some(k => text.includes(k))) return false
  return POSITIVE.some(k => text.includes(k.toLowerCase()))
}
```

**Step 4: Run test to verify it passes**

Run: `node --test tests/topic-filter.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/topic-filter.js tests/topic-filter.test.js
git commit -m "test+feat: add computer topic matcher"
```

### Task 2: 构建脚本生成计算机词表

**Files:**
- Modify: `scripts/build-index.js`
- Test: `tests/build-index-topics.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildComputerTopicWords } from '../scripts/build-index.js'

test('buildComputerTopicWords returns unique filtered words', () => {
  const words = buildComputerTopicWords([
    { word: 'algorithm', definition: 'computer process' },
    { word: 'algorithm', definition: 'computer process' },
    { word: 'banana', definition: 'fruit' }
  ])

  assert.deepEqual(words, ['algorithm'])
})
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/build-index-topics.test.js`
Expected: FAIL because `buildComputerTopicWords` not exported

**Step 3: Write minimal implementation**

```js
import { isComputerRelatedEntry } from '../src/utils/topic-filter.js'

export function buildComputerTopicWords(wordList) {
  return [...new Set(
    wordList
      .filter(item => isComputerRelatedEntry(item))
      .map(item => item.word)
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b))
}
```

并在构建流程中写入：`public/dictionary/topics/computer.json`。

**Step 4: Run test to verify it passes**

Run: `node --test tests/build-index-topics.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/build-index.js tests/build-index-topics.test.js
git commit -m "feat: generate computer topic word list during build"
```

### Task 3: 运行时主题词读取与随机抽词

**Files:**
- Modify: `src/utils/dictionary.js`
- Modify: `src/stores/dictionary.js`
- Test: `tests/topic-random.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { pickRandomWords } from '../src/utils/topic-filter.js'

test('pickRandomWords returns unique random subset with size limit', () => {
  const result = pickRandomWords(['a', 'b', 'c'], 2)
  assert.equal(result.length, 2)
  assert.equal(new Set(result).size, 2)
})
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/topic-random.test.js`
Expected: FAIL because `pickRandomWords` is missing

**Step 3: Write minimal implementation**

```js
export function pickRandomWords(words = [], count = 1) {
  const pool = [...words]
  const selected = []
  while (pool.length && selected.length < Math.max(0, count)) {
    const idx = Math.floor(Math.random() * pool.length)
    selected.push(pool[idx])
    pool.splice(idx, 1)
  }
  return selected
}
```

并新增：
- `dictionary.js` 中 `loadTopicWords(topic)`、`getRandomTopicWords(topic, count)`
- `dictionary store` 中 `loadRandomTopicWords(topic, count)`

**Step 4: Run test to verify it passes**

Run: `node --test tests/topic-random.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/dictionary.js src/stores/dictionary.js src/utils/topic-filter.js tests/topic-random.test.js
git commit -m "feat: add runtime topic word loading APIs"
```

### Task 4: 新增计算机学习页面与路由

**Files:**
- Create: `src/views/ComputerStudy.vue`
- Modify: `src/router/index.js`

**Step 1: Write the failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('router has ComputerStudy route', () => {
  const content = fs.readFileSync('src/router/index.js', 'utf8')
  assert.match(content, /path:\s*'\\/study\\/computer'/)
})
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/router-computer-route.test.js`
Expected: FAIL route not found

**Step 3: Write minimal implementation**

- 新页面逻辑基于 `Study.vue`，将 `loadRandomWord` 改为从 `dictionaryStore.loadRandomTopicWords('computer', 1)` 取词。
- 主题词库为空时显示降级提示并可跳回 `/study`。
- 保留快捷键 `1/2/3`、收藏、发音与掌握度交互。

**Step 4: Run test to verify it passes**

Run: `node --test tests/router-computer-route.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/views/ComputerStudy.vue src/router/index.js tests/router-computer-route.test.js
git commit -m "feat: add dedicated computer study route and page"
```

### Task 5: 首页与导航入口接入

**Files:**
- Modify: `src/views/Home.vue`
- Modify: `src/App.vue`
- Test: `tests/navigation-computer-entry.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('home and app include /study/computer entry', () => {
  const home = fs.readFileSync('src/views/Home.vue', 'utf8')
  const app = fs.readFileSync('src/App.vue', 'utf8')
  assert.match(home, /to="\\/study\\/computer"/)
  assert.match(app, /to="\\/study\\/computer"/)
})
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/navigation-computer-entry.test.js`
Expected: FAIL because entries are missing

**Step 3: Write minimal implementation**

- `Home.vue` 新增“计算机英语学习”快捷卡片
- `App.vue` 桌面导航和移动菜单新增入口，激活态与现有导航一致

**Step 4: Run test to verify it passes**

Run: `node --test tests/navigation-computer-entry.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/views/Home.vue src/App.vue tests/navigation-computer-entry.test.js
git commit -m "feat: expose computer study entry in home and nav"
```

### Task 6: 构建验证与回归检查

**Files:**
- Modify: `package.json` (optional, add `test` script)

**Step 1: Write failing integration check**

```bash
npm run build
# 预期首次可能失败（若路径或导出遗漏）
```

**Step 2: Fix minimal issues for green build**

- 修正构建脚本中的导入路径、输出目录创建、JSON 结构

**Step 3: Verify all tests pass**

Run:
- `node --test tests/topic-filter.test.js`
- `node --test tests/build-index-topics.test.js`
- `node --test tests/topic-random.test.js`
- `node --test tests/router-computer-route.test.js`
- `node --test tests/navigation-computer-entry.test.js`
- `npm run build`

Expected:
- 全部 PASS
- 生成 `public/dictionary/topics/computer.json`

**Step 4: Commit**

```bash
git add package.json package-lock.json public/dictionary/topics/computer.json
git commit -m "chore: verify computer topic module with tests and build"
```

