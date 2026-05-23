export interface QuestionSetSummary {
  id: string
  name: string
  questionCount: number
  createdAt: string
}

export interface QuestionSetDetail {
  id: string
  name: string
  createdAt: string
  questions: QuestionSetQuestion[]
}

export interface QuestionSetQuestion {
  category: string
  clue: string
  answer: string
}
