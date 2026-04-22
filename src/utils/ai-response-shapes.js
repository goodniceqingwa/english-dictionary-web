const dailyPlanTaskShape = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'taskType', 'instructions'],
  properties: {
    title: { type: 'string' },
    taskType: { type: 'string' },
    instructions: { type: 'string' },
    durationMinutes: { type: 'integer' },
    successCriteria: { type: 'string' },
  },
}

export const dailyPlanShape = {
  type: 'object',
  additionalProperties: false,
  required: ['sessionTitle', 'goals', 'tasks', 'recommendedWords', 'coachTip'],
  properties: {
    sessionTitle: { type: 'string' },
    goals: { type: 'array', items: { type: 'string' } },
    tasks: { type: 'array', items: dailyPlanTaskShape },
    recommendedWords: { type: 'array', items: { type: 'string' } },
    coachTip: { type: 'string' },
  },
}

export const reflectionShape = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'wins', 'blockers', 'nextActions'],
  properties: {
    summary: { type: 'string' },
    wins: { type: 'array', items: { type: 'string' } },
    blockers: { type: 'array', items: { type: 'string' } },
    nextActions: { type: 'array', items: { type: 'string' } },
  },
}

const quizQuestionShape = {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'title', 'correctAnswer', 'options'],
  properties: {
    type: { type: 'string' },
    title: { type: 'string' },
    correctAnswer: { type: 'string' },
    options: {
      type: 'array',
      items: { type: 'string' },
      minItems: 4,
      maxItems: 4,
    },
  },
}

export const quizShape = {
  type: 'object',
  additionalProperties: false,
  required: ['contextualQuestions'],
  properties: {
    contextualQuestions: {
      type: 'array',
      items: quizQuestionShape,
    },
  },
}

export const learningWorkflowResponseShapes = {
  generateDailyPlan: {
    schemaName: 'daily_plan',
    schema: dailyPlanShape,
  },
  generateQuiz: {
    schemaName: 'quiz',
    schema: quizShape,
  },
  summarizeReflection: {
    schemaName: 'reflection',
    schema: reflectionShape,
  },
}
