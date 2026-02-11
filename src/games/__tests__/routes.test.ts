import request from 'supertest'

import { app } from '../../app'
import * as gamesServices from '../services'

// Mock the games services
jest.mock('../services')

const mockLoginWithEmailPassword = gamesServices.loginWithEmailPassword as jest.MockedFunction<
  typeof gamesServices.loginWithEmailPassword
>
const mockRefreshIdToken = gamesServices.refreshIdToken as jest.MockedFunction<
  typeof gamesServices.refreshIdToken
>
const mockGetUserFromToken = gamesServices.getUserFromToken as jest.MockedFunction<
  typeof gamesServices.getUserFromToken
>
const mockGetUserInfo = gamesServices.getUserInfo as jest.MockedFunction<
  typeof gamesServices.getUserInfo
>
const mockRevokeUserTokens = gamesServices.revokeUserTokens as jest.MockedFunction<
  typeof gamesServices.revokeUserTokens
>

describe('Games Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ==================== POST /login ====================
  describe('POST /login', () => {
    it('should return 400 if email is missing', async () => {
      const response = await request(app).post('/login').send({ password: 'test123' })

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        success: false,
        code: 'missing-credentials',
        name: 'ValidationError',
        message: 'Email and password are required',
      })
    })

    it('should return 400 if password is missing', async () => {
      const response = await request(app).post('/login').send({ email: 'test@test.com' })

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        success: false,
        code: 'missing-credentials',
        name: 'ValidationError',
        message: 'Email and password are required',
      })
    })

    it('should return login response on success', async () => {
      const mockLoginResponse = {
        kind: 'identitytoolkit#VerifyPasswordResponse',
        localId: 'user123',
        email: 'test@test.com',
        idToken: 'mock-id-token',
        registered: true,
        refreshToken: 'mock-refresh-token',
        expiresIn: '3600',
      }

      mockLoginWithEmailPassword.mockResolvedValue(mockLoginResponse)

      const response = await request(app)
        .post('/login')
        .send({ email: 'test@test.com', password: 'password123' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockLoginResponse)
      expect(mockLoginWithEmailPassword).toHaveBeenCalledWith(
        'test@test.com',
        'password123',
        expect.any(String)
      )
    })

    it('should return error response on login failure', async () => {
      const mockErrorResponse = {
        success: false as const,
        code: 'invalid-credentials',
        name: 'AuthError',
        message: 'Invalid email or password',
      }

      mockLoginWithEmailPassword.mockResolvedValue(mockErrorResponse)

      const response = await request(app)
        .post('/login')
        .send({ email: 'test@test.com', password: 'wrongpassword' })

      expect(response.status).toBe(200) // Firebase returns 200 with error in body
      expect(response.body).toEqual(mockErrorResponse)
    })
  })

  // ==================== POST /refresh ====================
  describe('POST /refresh', () => {
    it('should return 400 if refreshToken is missing', async () => {
      const response = await request(app).post('/refresh').send({})

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        success: false,
        code: 'missing-refresh-token',
        name: 'ValidationError',
        message: 'Refresh token is required',
      })
    })

    it('should return new tokens on success', async () => {
      const mockRefreshResponse = {
        access_token: 'new-access-token',
        expires_in: '3600',
        token_type: 'Bearer',
        refresh_token: 'new-refresh-token',
        id_token: 'new-id-token',
        user_id: 'user123',
        project_id: 'project123',
      }

      mockRefreshIdToken.mockResolvedValue(mockRefreshResponse)

      const response = await request(app)
        .post('/refresh')
        .send({ refreshToken: 'valid-refresh-token' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockRefreshResponse)
    })
  })

  // ==================== POST /userinfo ====================
  describe('POST /userinfo', () => {
    it('should return 400 if idToken is missing', async () => {
      const response = await request(app).post('/userinfo').send({})

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        success: false,
        code: 'missing-id-token',
        name: 'ValidationError',
        message: 'ID token is required',
      })
    })

    it('should return 401 if token is invalid', async () => {
      mockGetUserFromToken.mockResolvedValue(null)

      const response = await request(app).post('/userinfo').send({ idToken: 'invalid-token' })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })

    it('should return user info on success', async () => {
      const mockDecodedToken = {
        uid: 'user123',
        aud: 'test-audience',
        auth_time: Date.now(),
        exp: Date.now() + 3600,
        iat: Date.now(),
        iss: 'test-issuer',
        sub: 'test-subject',
        firebase: {
          identities: {},
          sign_in_provider: 'password',
        },
      }

      const mockUserInfo = {
        uid: 'user123',
        email: 'test@test.com',
        emailVerified: true,
        displayName: 'Test User',
        photoURL: undefined,
        disabled: false,
        metadata: {
          creationTime: '2024-01-01T00:00:00Z',
          lastSignInTime: '2024-01-01T00:00:00Z',
        },
        providerData: [],
      }

      mockGetUserFromToken.mockResolvedValue(mockDecodedToken)
      mockGetUserInfo.mockResolvedValue(mockUserInfo)

      const response = await request(app).post('/userinfo').send({ idToken: 'valid-token' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual(mockUserInfo)
    })
  })

  // ==================== POST /logout ====================
  describe('POST /logout', () => {
    it('should return 400 if idToken is missing', async () => {
      const response = await request(app).post('/logout').send({})

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should return 401 if token is invalid', async () => {
      mockGetUserFromToken.mockResolvedValue(null)

      const response = await request(app).post('/logout').send({ idToken: 'invalid-token' })

      expect(response.status).toBe(401)
    })

    it('should logout successfully', async () => {
      const mockDecodedToken = {
        uid: 'user123',
        aud: 'test-audience',
        auth_time: Date.now(),
        exp: Date.now() + 3600,
        iat: Date.now(),
        iss: 'test-issuer',
        sub: 'test-subject',
        firebase: {
          identities: {},
          sign_in_provider: 'password',
        },
      }

      mockGetUserFromToken.mockResolvedValue(mockDecodedToken)
      mockRevokeUserTokens.mockResolvedValue(true)

      const response = await request(app).post('/logout').send({ idToken: 'valid-token' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(mockRevokeUserTokens).toHaveBeenCalledWith('user123')
    })
  })
})
