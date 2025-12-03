import request from 'supertest'

import { app } from '../../app'
import * as authServices from '../services'

// Mock the auth services
jest.mock('../services')

const mockGetUserFromToken = authServices.getUserFromToken as jest.MockedFunction<
  typeof authServices.getUserFromToken
>
const mockGetCustomLoginToken = authServices.getCustomLoginToken as jest.MockedFunction<
  typeof authServices.getCustomLoginToken
>

describe('Auth Routes', () => {
  describe('POST /auth/user-custom-token', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should return 400 if idToken is missing', async () => {
      const response = await request(app).post('/auth/user-custom-token').send({})

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        success: false,
        code: 'missing-id-token',
        message: 'idToken is required in request body',
      })
    })

    it('should return 401 if token verification fails', async () => {
      mockGetUserFromToken.mockResolvedValue(null)

      const response = await request(app)
        .post('/auth/user-custom-token')
        .send({ idToken: 'invalid-token' })

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        success: false,
        code: 'invalid-id-token',
        message: 'Failed to verify ID token',
      })
      expect(mockGetUserFromToken).toHaveBeenCalledWith('invalid-token')
    })

    it('should return 500 if custom token creation fails', async () => {
      const mockDecodedToken = {
        uid: 'test-uid',
        aud: 'test-audience',
        auth_time: Date.now(),
        exp: Date.now() + 3600,
        iat: Date.now(),
        iss: 'test-issuer',
        sub: 'test-subject',
        firebase: {
          identities: {},
          sign_in_provider: 'custom',
        },
      }

      mockGetUserFromToken.mockResolvedValue(mockDecodedToken)
      mockGetCustomLoginToken.mockResolvedValue(null)

      const response = await request(app)
        .post('/auth/user-custom-token')
        .send({ idToken: 'valid-token' })

      expect(response.status).toBe(500)
      expect(response.body).toEqual({
        success: false,
        code: 'custom-token-creation-failed',
        message: 'Failed to create custom token',
      })
    })

    it('should return custom token on success', async () => {
      const mockDecodedToken = {
        uid: 'test-uid',
        aud: 'test-audience',
        auth_time: Date.now(),
        exp: Date.now() + 3600,
        iat: Date.now(),
        iss: 'test-issuer',
        sub: 'test-subject',
        firebase: {
          identities: {},
          sign_in_provider: 'custom',
        },
      }

      const mockCustomToken = 'mock-custom-token'

      mockGetUserFromToken.mockResolvedValue(mockDecodedToken)
      mockGetCustomLoginToken.mockResolvedValue(mockCustomToken)

      const response = await request(app)
        .post('/auth/user-custom-token')
        .send({ idToken: 'valid-token' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        customToken: mockCustomToken,
      })
      expect(mockGetUserFromToken).toHaveBeenCalledWith('valid-token')
      expect(mockGetCustomLoginToken).toHaveBeenCalledWith(mockDecodedToken)
    })
  })
})

export {}
