-- ============================================
-- 英汉词典 - Supabase 数据库初始化脚本
-- ============================================

-- 创建用户收藏表
CREATE TABLE IF NOT EXISTS user_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, word)
);

-- 创建学习进度表
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  ease_factor REAL DEFAULT 2.5 NOT NULL,
  interval INTEGER DEFAULT 0 NOT NULL,
  repetitions INTEGER DEFAULT 0 NOT NULL,
  next_review TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, word)
);

-- 创建 AI 学习画像表
CREATE TABLE IF NOT EXISTS user_ai_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_level TEXT NOT NULL DEFAULT 'unknown',
  target_goal TEXT NOT NULL,
  available_minutes INTEGER NOT NULL DEFAULT 20,
  focus_topics TEXT[] DEFAULT '{}'::TEXT[],
  preferred_difficulty TEXT NOT NULL DEFAULT 'adaptive',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建学习工作流运行表
CREATE TABLE IF NOT EXISTS learning_workflow_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  current_stage TEXT NOT NULL DEFAULT 'idle',
  plan_json JSONB DEFAULT '{}'::JSONB NOT NULL,
  reflection_json JSONB DEFAULT '{}'::JSONB NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建学习工作流事件表
CREATE TABLE IF NOT EXISTS learning_workflow_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID REFERENCES learning_workflow_runs(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  input_json JSONB DEFAULT '{}'::JSONB NOT NULL,
  output_json JSONB DEFAULT '{}'::JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON user_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_word ON user_collections(word);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_next_review ON user_progress(next_review);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_word ON user_progress(user_id, word);
CREATE INDEX IF NOT EXISTS idx_learning_workflow_runs_user_id ON learning_workflow_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_workflow_runs_status ON learning_workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_learning_workflow_events_run_id ON learning_workflow_events(run_id);
CREATE INDEX IF NOT EXISTS idx_learning_workflow_events_run_created_at_id ON learning_workflow_events(run_id, created_at, id);
CREATE INDEX IF NOT EXISTS idx_learning_workflow_events_event_type ON learning_workflow_events(event_type);

-- 启用 Row Level Security (RLS)
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_workflow_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- user_collections 表的 RLS 策略
-- ============================================

-- 用户可以查看自己的收藏
CREATE POLICY "Users can view own collections"
  ON user_collections
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以插入自己的收藏
CREATE POLICY "Users can insert own collections"
  ON user_collections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以删除自己的收藏
CREATE POLICY "Users can delete own collections"
  ON user_collections
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- user_progress 表的 RLS 策略
-- ============================================

-- 用户可以查看自己的进度
CREATE POLICY "Users can view own progress"
  ON user_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以插入自己的进度
CREATE POLICY "Users can insert own progress"
  ON user_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的进度
CREATE POLICY "Users can update own progress"
  ON user_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户可以删除自己的进度
CREATE POLICY "Users can delete own progress"
  ON user_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- user_ai_profiles 表的 RLS 策略
-- ============================================

-- 用户可以查看自己的 AI 学习画像
CREATE POLICY "Users can view own ai profiles"
  ON user_ai_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以插入自己的 AI 学习画像
CREATE POLICY "Users can insert own ai profiles"
  ON user_ai_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的 AI 学习画像
CREATE POLICY "Users can update own ai profiles"
  ON user_ai_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用户可以删除自己的 AI 学习画像
CREATE POLICY "Users can delete own ai profiles"
  ON user_ai_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- learning_workflow_runs 表的 RLS 策略
-- ============================================

-- 用户可以查看自己的工作流运行记录
CREATE POLICY "Users can view own workflow runs"
  ON learning_workflow_runs
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以插入自己的工作流运行记录
CREATE POLICY "Users can insert own workflow runs"
  ON learning_workflow_runs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的工作流运行记录
CREATE POLICY "Users can update own workflow runs"
  ON learning_workflow_runs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- learning_workflow_events 表的 RLS 策略
-- ============================================

-- 用户可以查看自己的工作流事件
CREATE POLICY "Users can view own workflow events"
  ON learning_workflow_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM learning_workflow_runs
      WHERE learning_workflow_runs.id = learning_workflow_events.run_id
      AND learning_workflow_runs.user_id = auth.uid()
    )
  );

-- 用户可以插入自己的工作流事件
CREATE POLICY "Users can insert own workflow events"
  ON learning_workflow_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM learning_workflow_runs
      WHERE learning_workflow_runs.id = learning_workflow_events.run_id
      AND learning_workflow_runs.user_id = auth.uid()
    )
  );

-- ============================================
-- 触发器：自动更新 updated_at 字段
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_ai_profiles_updated_at
  BEFORE UPDATE ON user_ai_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_workflow_runs_updated_at
  BEFORE UPDATE ON learning_workflow_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 完成
-- ============================================

-- 验证表已创建
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_collections',
  'user_progress',
  'user_ai_profiles',
  'learning_workflow_runs',
  'learning_workflow_events'
);
