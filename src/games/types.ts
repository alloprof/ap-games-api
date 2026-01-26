export interface FirebaseLoginRequest {
  email: string
  password: string
}

export interface FirebaseLoginResponse {
  kind: string
  localId: string
  email: string
  displayName?: string
  idToken: string
  registered: boolean
  refreshToken: string
  expiresIn: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  access_token: string
  expires_in: string
  token_type: string
  refresh_token: string
  id_token: string
  user_id: string
  project_id: string
}

export interface UserInfoRequest {
  idToken: string
}

export interface CustomTokenRequest {
  idToken: string
}

export interface CustomTokenResponse {
  customToken: string
}

export interface FirestoreReadRequest {
  idToken: string
  document: string[]
}

export interface FirestoreReadResponse {
  success: boolean
  data?: Record<string, unknown>
  code?: string
  name?: string
  message?: string
}

export interface FirestoreWriteRequest {
  idToken: string
  document: string[]
  data: Record<string, unknown>
  options?: {
    merge?: boolean
    mergeFields?: string[]
  }
}

export interface FirestoreWriteResponse {
  success: boolean
  code?: string
  name?: string
  message?: string
}

export interface SendEventRequest {
  idToken: string
  client_id: string
  event: string
  params?: Record<string, unknown>
}

export interface SendEventResponse {
  success: boolean
}

export interface ErrorResponse {
  success: false
  code?: string
  name?: string
  message?: string
  full?: unknown
}
