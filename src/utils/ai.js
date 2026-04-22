import { supabase } from './supabase.js'

export async function invokeLearningWorkflow(body) {
  return supabase.functions.invoke('learning-workflow', {
    body,
  })
}
