# 学习会话导航与混合测试 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在学习页增加会话内“上一个/下一个单词”导航，并新增基于已学词的混合测试页（选择题+拼写题）。

**Architecture:** 通过 `learning` store 统一维护会话队列、当前索引和已学词集合；`Study.vue` 消费会话状态并提供导航；新增 `StudyQuiz.vue` 读取同一状态生成混合题。这样学习与测试解耦，且数据来源一致。

**Tech Stack:** Vue 3, Pinia, Vue Router, Vite, Node.js node:test

---

### Task 1: 会话状态模型扩展

**Files:**
- Modify: `src/stores/learning.js`
- Test: `tests/study-session-store.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('learning store exposes session queue APIs', () => {
  const content = fs.readFileSync('src/stores/learning.js', 'utf8')
  assert.equal(content.includes('sessionQueue'), true)
  assert.equal(content.includes('addSessionWord'), true)
  assert.equal(content.includes('goToPreviousSessionWord'), true)
  assert.equal(content.includes('goToNextSessionWord'), true)
})
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/study-session-store.test.js`
Expected: FAIL，缺少上述会话 API

**Step 3: Write minimal implementation**

- 在 `learning` store 增加：
  - `sessionQueue`, `sessionWordMap`, `currentSessionIndex`, `learnedWordsInSession`
  - `addSessionWord(wordDetail)`
  - `markLearnedInSession(word)`
  - `goToPreviousSessionWord()` / `goToNextSessionWord()`
  - `getCurrentSessionWordDetail()`

**Step 4: Run test to verify it passes**

Run: `node --test tests/study-session-store.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/learning.js tests/study-session-store.test.js
git commit -m "feat: add study session queue state and navigation APIs"
```

### Task 2: 学习页接入会话前后导航

**Files:**
- Modify: `src/views/Study.vue`
- Test: `tests/study-navigation-entry.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('Study page includes previous/next controls', () => {
  const content = fs.readFileSync('src/views/Study.vue', 'utf8')
  assert.equal(content.includes('上一个单词'), true)
  assert.equal(content.includes('下一个单词'), true)
})
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/study-navigation-entry.test.js`
Expected: FAIL，页面尚无按钮

**Step 3: Write minimal implementation**

- 学习页加载词后调用 `addSessionWord`。
- 新增按钮：`上一个单词`、`下一个单词`。
- `上一个`：调用 store 回退并加载对应词详情。
- `下一个`：优先会话前进，若无后继则继续随机拉新词。

**Step 4: Run test to verify it passes**

Run: `node --test tests/study-navigation-entry.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/views/Study.vue tests/study-navigation-entry.test.js
git commit -m "feat: add prev-next word navigation in study session"
```

### Task 3: 混合测试页面与路由

**Files:**
- Create: `src/views/StudyQuiz.vue`
- Modify: `src/router/index.js`
- Test: `tests/study-quiz-route.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('router includes study quiz route', () => {
  const content = fs.readFileSync('src/router/index.js', 'utf8')
  assert.equal(content.includes("path: '/study/quiz'"), true)
})
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/study-quiz-route.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**

- 新建 `/study/quiz` 页面：
  - 读取 `learnedWordsInSession`
  - 随机生成两类题型：
    - 选择题（英文->中文）
    - 拼写题（中文->英文）
  - 提交后统计正确率并显示结果
- 路由注册 `StudyQuiz`

**Step 4: Run test to verify it passes**

Run: `node --test tests/study-quiz-route.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/views/StudyQuiz.vue src/router/index.js tests/study-quiz-route.test.js
git commit -m "feat: add mixed quiz page for learned session words"
```

### Task 4: 学习页增加测试入口与空状态处理

**Files:**
- Modify: `src/views/Study.vue`
- Test: `tests/study-quiz-entry.test.js`

**Step 1: Write the failing test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('Study page includes quiz entry button', () => {
  const content = fs.readFileSync('src/views/Study.vue', 'utf8')
  assert.equal(content.includes('/study/quiz'), true)
})
```

**Step 2: Run test to verify it fails**

Run: `node --test tests/study-quiz-entry.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**

- 在学习页添加“开始测试”入口。
- 无已学词时按钮禁用并提示“先学习再测试”。

**Step 4: Run test to verify it passes**

Run: `node --test tests/study-quiz-entry.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/views/Study.vue tests/study-quiz-entry.test.js
git commit -m "feat: add quiz entry and learned-words guard in study"
```

### Task 5: 全量验证

**Files:**
- Modify: (if needed) `src/views/StudyQuiz.vue`, `src/stores/learning.js`

**Step 1: Run all new tests**

Run:
- `node --test tests/study-session-store.test.js`
- `node --test tests/study-navigation-entry.test.js`
- `node --test tests/study-quiz-route.test.js`
- `node --test tests/study-quiz-entry.test.js`

Expected: 全部 PASS

**Step 2: Run existing feature tests + build**

Run:
- `node --test tests/topic-filter.test.js tests/build-index-topics.test.js tests/topic-random.test.js tests/router-computer-route.test.js tests/navigation-computer-entry.test.js`
- `npm run build`

Expected: PASS

**Step 3: Commit**

```bash
git add src tests
git commit -m "test: verify study session navigation and mixed quiz"
```

