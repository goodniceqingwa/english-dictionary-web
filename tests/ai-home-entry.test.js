import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('home exposes authenticated and anonymous coach entries with summary area', () => {
  const home = fs.readFileSync('src/views/Home.vue', 'utf8')
  assert.match(home, /v-if="userStore\.isAuthenticated"[\s\S]*?to="\/coach"/)
  assert.match(home, /v-else[\s\S]*?to="\/auth\?redirect=\/coach"/)
  assert.match(home, /今日 AI 计划摘要/)
  assert.match(home, /AI 当前阶段/)
  assert.match(home, /任务完成/)
  assert.match(home, /推荐词进度/)
  assert.match(home, /下一步/)
})

test('app exposes coach entry in both desktop and mobile navigation', () => {
  const app = fs.readFileSync('src/App.vue', 'utf8')
  assert.match(app, /hidden md:flex items-center space-x-6[\s\S]*?to="\/coach"/)
  assert.match(app, /v-show="mobileMenuOpen" class="md:hidden py-4 space-y-2"[\s\S]*?to="\/coach"/)
})

test('home summary derives text from structured coach plan fields', () => {
  const home = fs.readFileSync('src/views/Home.vue', 'utf8')
  assert.match(home, /sessionTitle/)
  assert.match(home, /focus/)
  assert.match(home, /summary/)
  assert.match(home, /goals/)
  assert.match(home, /const coachStageLabel = computed\(/)
  assert.match(home, /const coachSummaryMetrics = computed\(/)
  assert.match(home, /const coachPrimaryAction = computed\(/)
  assert.match(home, /v-for="metric in coachSummaryMetrics"/)
  assert.match(home, /coachPrimaryAction\.label/)
})
