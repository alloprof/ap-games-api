/**
 * Types for exercisers routes
 */

export interface ScenarioResponse<T = Record<string, unknown>> {
  success: boolean
  data?: T
  message?: string
}

export interface ListScenariosRequest {
  appId: string
  tag: string
  author?: 'squidex' | 'alloprof'
}

export interface ListScenariosResponse {
  success: boolean
  list?: string[]
  count?: number
  message?: string
}
