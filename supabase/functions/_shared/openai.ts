type JsonSchema = Record<string, unknown>

type StructuredResponseRequest = {
  action: string
  prompt: string
  requestContext: Record<string, unknown>
  schemaName: string
  schema: JsonSchema
  model?: string
}

type IncompleteDetails = {
  reason?: string
} | null

type OpenAIResponsePayload = {
  id?: string
  model?: string
  status?: string
  error?: {
    message?: string
  } | null
  incomplete_details?: IncompleteDetails
  output_text?: string
  output_parsed?: Record<string, unknown>
  output?: Array<{
    type?: string
    content?: Array<{
      type?: string
      text?: string
      parsed?: Record<string, unknown>
      refusal?: string
    }>
  }>
}

const OPENAI_API_URL = 'https://api.openai.com/v1/responses'
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini'

export class OpenAIResponseError extends Error {
  status: number
  code: string
  details?: Record<string, unknown>

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

function extractStructuredOutput(payload: OpenAIResponsePayload) {
  if (payload.status === 'incomplete') {
    throw new OpenAIResponseError(
      502,
      'openai_incomplete',
      'OpenAI returned an incomplete structured response',
      {
        incomplete_details: payload.incomplete_details ?? null,
      }
    )
  }

  if (payload.error?.message) {
    console.error('OpenAI structured output error payload:', payload.error.message)
    throw new OpenAIResponseError(
      502,
      'openai_response_error',
      'OpenAI returned an error while generating structured output'
    )
  }

  if (payload.output_parsed && typeof payload.output_parsed === 'object') {
    return payload.output_parsed
  }

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === 'refusal') {
        throw new OpenAIResponseError(
          422,
          'openai_refusal',
          content.refusal || 'OpenAI refused to fulfill the request'
        )
      }

      if (content.parsed && typeof content.parsed === 'object') {
        return content.parsed
      }

      if (typeof content.text === 'string' && content.text.trim()) {
        try {
          return JSON.parse(content.text)
        } catch {
          throw new OpenAIResponseError(
            502,
            'openai_invalid_json',
            'OpenAI returned invalid structured JSON'
          )
        }
      }
    }
  }

  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    try {
      return JSON.parse(payload.output_text)
    } catch {
      throw new OpenAIResponseError(
        502,
        'openai_invalid_json',
        'OpenAI returned invalid structured JSON'
      )
    }
  }

  throw new OpenAIResponseError(
    502,
    'openai_missing_output',
    'OpenAI response did not contain structured JSON output'
  )
}

export async function createStructuredResponse({
  action,
  prompt,
  requestContext,
  schemaName,
  schema,
  model = Deno.env.get('OPENAI_MODEL') ?? DEFAULT_OPENAI_MODEL,
}: StructuredResponseRequest) {
  const apiKey = Deno.env.get('OPENAI_API_KEY')

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: prompt }],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify({ action, requestContext }, null, 2),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('OpenAI HTTP error:', response.status, errorText)
    throw new OpenAIResponseError(
      502,
      'openai_http_error',
      'OpenAI request failed'
    )
  }

  const payload = (await response.json()) as OpenAIResponsePayload
  const output = extractStructuredOutput(payload)

  return {
    id: payload.id ?? null,
    model: payload.model ?? model,
    output,
  }
}
