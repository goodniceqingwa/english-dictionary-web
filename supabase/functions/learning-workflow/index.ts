import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  learningWorkflowResponseShapes,
} from '../../../src/utils/ai-response-shapes.js'
import { corsHeaders } from '../_shared/cors.ts'
import {
  createStructuredResponse,
  OpenAIResponseError,
} from '../_shared/openai.ts'

type WorkflowAction = keyof typeof learningWorkflowResponseShapes
type JsonRecord = Record<string, unknown>

const ACTION_PROMPTS: Record<WorkflowAction, string> = {
  generateDailyPlan: [
    'You are an English learning coach.',
    'Create a focused study plan for one learning session.',
    'Use only the provided context and return JSON that strictly matches the schema.',
  ].join(' '),
  generateQuiz: [
    'You are an English learning coach.',
    'Create only contextual multiple-choice quiz questions for the current study plan.',
    'Use only the provided context and return JSON that strictly matches the schema.',
  ].join(' '),
  summarizeReflection: [
    'You are an English learning coach.',
    'Summarize the completed session and provide practical next steps.',
    'Use only the provided context and return JSON that strictly matches the schema.',
  ].join(' '),
}

class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  })
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {}
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []
}

function asObjectArray(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function parseBearerToken(request: Request) {
  const header = request.headers.get('Authorization') ?? request.headers.get('authorization') ?? ''
  const [scheme, token] = header.split(' ')

  if (scheme.toLowerCase() !== 'bearer' || !token) {
    throw new HttpError(401, 'Missing Authorization bearer token')
  }

  return token
}

function isClientTokenErrorMessage(message: string) {
  return /expired|invalid|malformed|signature|jwt|token|claim/i.test(message)
}

async function validateUserIdentity(request: Request) {
  const devUserId = request.headers.get('x-user-id')
  if (devUserId && Deno.env.get('ALLOW_INSECURE_DEV_USER_ID') === 'true') {
    return {
      userId: devUserId,
      source: 'x-user-id',
    }
  }

  const token = parseBearerToken(request)
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabasePublishableKey =
    Deno.env.get('SB_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new HttpError(500, 'Supabase auth environment is not configured')
  }

  const supabase = createClient(supabaseUrl, supabasePublishableKey)
  const { data, error } = await supabase.auth.getClaims(token)
  const userId = data?.claims?.sub

  if (typeof userId === 'string' && userId) {
    return {
      userId,
      source: 'supabase-claims',
    }
  }

  if (error) {
    if (isClientTokenErrorMessage(error.message ?? '')) {
      throw new HttpError(401, 'Invalid Supabase bearer token')
    }

    throw new HttpError(503, 'Supabase token verification is temporarily unavailable')
  }

  throw new HttpError(401, 'JWT claims did not contain a valid user id')
}

function extractRequestContext(action: WorkflowAction, body: JsonRecord) {
  if (action === 'generateDailyPlan') {
    return {
      profile: asRecord(body.profile),
      progressSnapshot: asRecord(body.progressSnapshot),
      recentActivity: asRecord(body.recentActivity),
    }
  }

  if (action === 'generateQuiz') {
    return {
      runId: typeof body.runId === 'string' ? body.runId : null,
      learnedWords: asStringArray(body.learnedWords),
      planTasks: asStringArray(body.planTasks),
      studySummary: asRecord(body.studySummary),
    }
  }

  return {
    runId: typeof body.runId === 'string' ? body.runId : null,
    learnedWords: asStringArray(body.learnedWords),
    quizAnswers: asObjectArray(body.quizAnswers),
    studySummary: asRecord(body.studySummary),
  }
}

function hasRequestContext(context: JsonRecord) {
  return Object.values(context).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0
    }

    if (isRecord(value)) {
      return Object.keys(value).length > 0
    }

    return typeof value === 'string' && value.length > 0
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    let body: JsonRecord

    try {
      body = (await request.json()) as JsonRecord
    } catch {
      throw new HttpError(400, 'Request body must be valid JSON')
    }

    const action = body.action

    if (action !== 'generateDailyPlan' && action !== 'generateQuiz' && action !== 'summarizeReflection') {
      return json({ error: 'Unsupported action' }, 400)
    }

    const identity = await validateUserIdentity(request)
    const requestContext = extractRequestContext(action, body)

    if (!hasRequestContext(requestContext)) {
      return json({ error: 'Request context is required' }, 400)
    }

    const { schemaName, schema } = learningWorkflowResponseShapes[action]
    const response = await createStructuredResponse({
      action,
      prompt: ACTION_PROMPTS[action],
      requestContext,
      schemaName,
      schema,
    })

    return json({
      ok: true,
      action,
      userId: identity.userId,
      requestContext,
      data: response.output,
      meta: {
        authSource: identity.source,
        responseId: response.id,
        model: response.model,
        schemaName,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    if (error instanceof HttpError) {
      return json({ error: message }, error.status)
    }

    if (error instanceof OpenAIResponseError) {
      return json(
        {
          error: message,
          code: error.code,
          details: error.details ?? null,
        },
        error.status
      )
    }

    return json({ error: message }, 500)
  }
})
