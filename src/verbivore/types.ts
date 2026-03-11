// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export interface GeneratorData {
  ID: string
  Author: string
  Timestamp: number
  IsOffline: boolean
  Tag: string[]
  [key: string]: unknown
}

export interface GetGeneratorResponse {
  success: boolean
  generatorID?: string
  authorID?: string
  data?: GeneratorData
  message?: string
}

export interface GetAllGeneratorsResponse {
  success: boolean
  generatorIDs?: string[]
  message?: string
}

export interface AddGeneratorRequest {
  data: Omit<GeneratorData, 'ID' | 'Author' | 'Timestamp' | 'IsOffline'>
  generatorID?: string
}

export interface AddGeneratorResponse {
  success: boolean
  generatorID?: string
  data?: GeneratorData
  message?: string
}

export interface DeleteGeneratorRequest {
  generatorID: string
}

export interface DeleteGeneratorResponse {
  success: boolean
  generatorID?: string
  data?: GeneratorData
  message?: string
}

// ---------------------------------------------------------------------------
// Verbs
// ---------------------------------------------------------------------------

export interface VerbItem {
  id: string
  'id-verbe': string
}

export interface GetActiveVerbsResponse {
  success: boolean
  total?: number
  items?: VerbItem[]
  message?: string
}

// ---------------------------------------------------------------------------
// WowChef
// ---------------------------------------------------------------------------

export interface SchoolScores {
  school1: number
  school2: number
  school3: number
  school4: number
}

export interface AddScoreRequest {
  schoolId: number
  correctConjugations: number
}

export interface AddScoreResponse {
  success: boolean
  schoolId?: number
  correctConjugations?: number
  message?: string
}

export interface GetCurrentScoresResponse {
  success: boolean
  period?: string
  scores?: SchoolScores
  daysRemainingInMonth?: number
  message?: string
}

export interface GetLastMonthWinnerResponse {
  success: boolean
  period?: string
  winnerSchoolId?: number
  winnerScore?: number
  scores?: SchoolScores
  message?: string
}

// ---------------------------------------------------------------------------
// Squidex webhook
// ---------------------------------------------------------------------------

export interface SquidexWebhookResponse {
  ok: boolean
  action?: 'upsert' | 'deleted'
  id?: string
  actif?: boolean
  skipped?: string
  error?: string
}
