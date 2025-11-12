// Squidex API types and interfaces

export interface SquidexConfig {
  appName: string
  clientId: string
  clientSecret: string
  url: string // URL to Squidex installation
}

export interface SquidexAuthToken {
  access_token: string
  token_type: string
  expires_in: number
}

export interface SquidexContent {
  id: string
  created: string
  createdBy: string
  lastModified: string
  lastModifiedBy: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
  version: number
}

export interface SquidexQuery {
  $top?: number
  $skip?: number
  $filter?: string
  $orderby?: string
}
