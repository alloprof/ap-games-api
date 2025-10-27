import type { DecodedIdToken } from 'firebase-admin/auth'

export interface CustomTokenRequest {
  idToken: string
}

export interface CustomTokenResponse {
  customToken: string
}

export interface ErrorResponse {
  success: false
  code?: string
  name?: string
  message?: string
}

export type { DecodedIdToken }
