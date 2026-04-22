import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY ?? ''

function createSupabaseFallbackClient() {
  const createError = () => new Error('Supabase client is not configured')

  function createQueryBuilder() {
    const builder = {
      select: () => builder,
      insert: () => builder,
      update: () => builder,
      upsert: () => builder,
      delete: () => builder,
      eq: () => builder,
      lte: () => builder,
      order: () => builder,
      limit: () => builder,
      maybeSingle: async () => ({ data: null, error: createError() }),
      single: async () => ({ data: null, error: createError() }),
    }

    return builder
  }

  return {
    auth: {
      signUp: async () => ({ data: null, error: createError() }),
      signInWithPassword: async () => ({ data: null, error: createError() }),
      signInWithOAuth: async () => ({ data: null, error: createError() }),
      signOut: async () => ({ error: createError() }),
      getUser: async () => ({ data: { user: null }, error: createError() }),
      onAuthStateChange() {
        return {
          data: {
            subscription: {
              unsubscribe() {},
            },
          },
        }
      },
    },
    from() {
      return createQueryBuilder()
    },
    functions: {
      invoke: async () => ({ data: null, error: createError() }),
    },
  }
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createSupabaseFallbackClient()

const UNIQUE_CONSTRAINT_ERROR_CODES = new Set(['23505'])

const WORKFLOW_RUN_FIELD_MAP = {
  currentStage: 'current_stage',
  planJson: 'plan_json',
  reflectionJson: 'reflection_json',
  startedAt: 'started_at',
  completedAt: 'completed_at',
}

function isUniqueConstraintError(error) {
  if (!error) {
    return false
  }

  return UNIQUE_CONSTRAINT_ERROR_CODES.has(error.code)
    || /duplicate key value|unique constraint/i.test(error.message || '')
}

function serializeWorkflowRunPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload
  }

  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [WORKFLOW_RUN_FIELD_MAP[key] || key, value])
  )
}

// 用户认证相关
export const auth = {
  // 邮箱注册
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  },

  // 邮箱登录
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Google OAuth 登录
  async signInWithGoogle() {
    // 显式指定回调，避免依赖 Supabase Site URL 静态配置
    // dev → http://localhost:5173/，生产 → https://<user>.github.io/english-dictionary-web/
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}${import.meta.env.BASE_URL}`
      : undefined
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: redirectTo ? { redirectTo } : undefined,
    })
    return { data, error }
  },

  // 登出
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // 获取当前用户
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // 监听认证状态变化
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// 收藏相关
export const collections = {
  // 获取用户收藏列表
  async getCollections(userId) {
    const { data, error } = await supabase
      .from('user_collections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // 添加收藏
  async addCollection(userId, word) {
    const { data, error } = await supabase
      .from('user_collections')
      .insert([{ user_id: userId, word }])
      .select()
    return { data, error }
  },

  // 移除收藏
  async removeCollection(userId, word) {
    const { error } = await supabase
      .from('user_collections')
      .delete()
      .eq('user_id', userId)
      .eq('word', word)
    return { error }
  },

  // 检查是否已收藏
  async isCollected(userId, word) {
    const { data, error } = await supabase
      .from('user_collections')
      .select('id')
      .eq('user_id', userId)
      .eq('word', word)
      .single()
    return { exists: !!data, error }
  }
}

// 学习进度相关
export const progress = {
  // 获取用户学习进度
  async getProgress(userId) {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
    return { data, error }
  },

  // 获取单个单词的学习进度
  async getWordProgress(userId, word) {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('word', word)
      .single()
    return { data, error }
  },

  // 更新学习进度
  async updateProgress(userId, word, progressData) {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        word,
        ...progressData,
        last_reviewed: new Date().toISOString()
      })
      .select()
    return { data, error }
  },

  // 获取待复习的单词
  async getDueWords(userId) {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review', now)
      .order('next_review', { ascending: true })
    return { data, error }
  },

  // 获取学习统计
  async getStats(userId) {
    const { data: allProgress, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)

    if (error) return { data: null, error }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const stats = {
      totalWords: allProgress.length,
      learnedToday: allProgress.filter(p => {
        const lastReviewed = new Date(p.last_reviewed)
        return lastReviewed >= today
      }).length,
      dueWords: allProgress.filter(p => new Date(p.next_review) <= now).length,
      masteredWords: allProgress.filter(p => p.repetitions >= 5).length
    }

    return { data: stats, error: null }
  }
}

// AI 学习画像相关
export const aiProfiles = {
  async getProfile(userId) {
    return supabase
      .from('user_ai_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
  },

  async upsertProfile(payload) {
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_ai_profiles')
      .update(payload)
      .eq('user_id', payload.user_id)
      .select()
      .maybeSingle()

    if (updatedProfile || updateError) {
      return { data: updatedProfile, error: updateError }
    }

    const { data: insertedProfile, error: insertError } = await supabase
      .from('user_ai_profiles')
      .insert(payload)
      .select()
      .single()

    if (!insertError || !isUniqueConstraintError(insertError)) {
      return { data: insertedProfile, error: insertError }
    }

    return supabase
      .from('user_ai_profiles')
      .update(payload)
      .eq('user_id', payload.user_id)
      .select()
      .single()
  },
}

// 学习工作流相关
export const workflowRuns = {
  async createRun(payload) {
    const serializedPayload = serializeWorkflowRunPayload(payload)

    return supabase
      .from('learning_workflow_runs')
      .insert(serializedPayload)
      .select()
      .single()
  },

  async getLatestRun(userId) {
    return supabase
      .from('learning_workflow_runs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  },

  async getRunById(runId) {
    return supabase
      .from('learning_workflow_runs')
      .select('*')
      .eq('id', runId)
      .maybeSingle()
  },

  async updateRun(runId, payload) {
    const serializedPayload = serializeWorkflowRunPayload(payload)

    return supabase
      .from('learning_workflow_runs')
      .update(serializedPayload)
      .eq('id', runId)
      .select()
      .single()
  },
}

export const workflowEvents = {
  async getRunEvents(runId) {
    return supabase
      .from('learning_workflow_events')
      .select('*')
      .eq('run_id', runId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
  },

  async addEvent(payload) {
    return supabase
      .from('learning_workflow_events')
      .insert(payload)
      .select()
      .single()
  },
}
