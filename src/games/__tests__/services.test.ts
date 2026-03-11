import axios from 'axios'

import * as firebaseModule from '../../core/firebase'
import {
  getFirestore,
  getUserFromToken,
  getCustomLoginToken,
  revokeUserTokens,
  loginWithEmailPassword,
  refreshIdToken,
  getUserInfo,
  sendAnalyticsEvent,
} from '../services'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// Mock firebase module
jest.mock('../../core/firebase')
const mockedFirebaseModule = firebaseModule as jest.Mocked<typeof firebaseModule>

// Mock logger to suppress output during tests
jest.mock('../../core/logger/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

describe('Games Services', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getFirestore', () => {
    it('should return firestore instance from admin SDK', () => {
      const mockFirestore = { collection: jest.fn() }
      const mockAdmin = { firestore: jest.fn().mockReturnValue(mockFirestore) }
      mockedFirebaseModule.getFirebaseAdmin.mockReturnValue(mockAdmin as never)

      const result = getFirestore()

      expect(mockedFirebaseModule.getFirebaseAdmin).toHaveBeenCalled()
      expect(result).toBe(mockFirestore)
    })
  })

  describe('getUserFromToken', () => {
    it('should return decoded token on success', async () => {
      const mockDecodedToken = {
        uid: 'user123',
        aud: 'test-audience',
        auth_time: Date.now(),
        exp: Date.now() + 3600,
        iat: Date.now(),
        iss: 'test-issuer',
        sub: 'test-subject',
        firebase: { identities: {}, sign_in_provider: 'password' },
      }

      const mockAuth = {
        verifyIdToken: jest.fn().mockResolvedValue(mockDecodedToken),
      }
      mockedFirebaseModule.getAuth.mockReturnValue(mockAuth as never)

      const result = await getUserFromToken('valid-token')

      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-token', true)
      expect(result).toEqual(mockDecodedToken)
    })

    it('should return null on verification failure', async () => {
      const mockAuth = {
        verifyIdToken: jest.fn().mockRejectedValue(new Error('Invalid token')),
      }
      mockedFirebaseModule.getAuth.mockReturnValue(mockAuth as never)

      const result = await getUserFromToken('invalid-token')

      expect(result).toBeNull()
    })
  })

  describe('getCustomLoginToken', () => {
    it('should return custom token on success', async () => {
      const mockDecodedToken = { uid: 'user123' } as never
      const mockAuth = {
        createCustomToken: jest.fn().mockResolvedValue('custom-token-123'),
      }
      mockedFirebaseModule.getAuth.mockReturnValue(mockAuth as never)

      const result = await getCustomLoginToken(mockDecodedToken)

      expect(mockAuth.createCustomToken).toHaveBeenCalledWith('user123')
      expect(result).toBe('custom-token-123')
    })

    it('should return null on failure', async () => {
      const mockDecodedToken = { uid: 'user123' } as never
      const mockAuth = {
        createCustomToken: jest.fn().mockRejectedValue(new Error('Failed')),
      }
      mockedFirebaseModule.getAuth.mockReturnValue(mockAuth as never)

      const result = await getCustomLoginToken(mockDecodedToken)

      expect(result).toBeNull()
    })
  })

  describe('revokeUserTokens', () => {
    it('should return true on successful revocation', async () => {
      const mockAuth = {
        revokeRefreshTokens: jest.fn().mockResolvedValue(undefined),
      }
      mockedFirebaseModule.getAuth.mockReturnValue(mockAuth as never)

      const result = await revokeUserTokens('user123')

      expect(mockAuth.revokeRefreshTokens).toHaveBeenCalledWith('user123')
      expect(result).toBe(true)
    })

    it('should return false on failure', async () => {
      const mockAuth = {
        revokeRefreshTokens: jest.fn().mockRejectedValue(new Error('Failed')),
      }
      mockedFirebaseModule.getAuth.mockReturnValue(mockAuth as never)

      const result = await revokeUserTokens('user123')

      expect(result).toBe(false)
    })
  })

  describe('loginWithEmailPassword', () => {
    it('should return login response on success', async () => {
      const mockResponse = {
        data: {
          kind: 'identitytoolkit#VerifyPasswordResponse',
          localId: 'user123',
          email: 'test@test.com',
          idToken: 'id-token',
          registered: true,
          refreshToken: 'refresh-token',
          expiresIn: '3600',
        },
      }
      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await loginWithEmailPassword('test@test.com', 'password123', 'api-key')

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=api-key',
        { email: 'test@test.com', password: 'password123', returnSecureToken: true },
        { headers: { 'Content-Type': 'application/json' } }
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('should return error response on axios error with response data', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            error: { message: 'INVALID_PASSWORD' },
          },
        },
      }
      mockedAxios.post.mockRejectedValue(axiosError)
      mockedAxios.isAxiosError.mockReturnValue(true)

      const result = await loginWithEmailPassword('test@test.com', 'wrong', 'api-key')

      expect(result).toEqual({
        success: false,
        code: 'INVALID_PASSWORD',
        name: 'FirebaseError',
        full: axiosError.response.data,
      })
    })

    it('should return generic error on unhandled exception', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'))
      mockedAxios.isAxiosError.mockReturnValue(false)

      const result = await loginWithEmailPassword('test@test.com', 'password', 'api-key')

      expect(result).toEqual({
        success: false,
        code: 'unhandled-exception',
        name: 'FirebaseError',
      })
    })
  })

  describe('refreshIdToken', () => {
    it('should return new tokens on success', async () => {
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          expires_in: '3600',
          token_type: 'Bearer',
          refresh_token: 'new-refresh-token',
          id_token: 'new-id-token',
          user_id: 'user123',
          project_id: 'project123',
        },
      }
      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await refreshIdToken('old-refresh-token', 'api-key')

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://securetoken.googleapis.com/v1/token?key=api-key',
        { refresh_token: 'old-refresh-token', grant_type: 'refresh_token' },
        { headers: { 'Content-Type': 'application/json' } }
      )
      expect(result).toEqual(mockResponse.data)
    })

    it('should return error response on axios error', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          data: {
            error: { message: 'TOKEN_EXPIRED' },
          },
        },
      }
      mockedAxios.post.mockRejectedValue(axiosError)
      mockedAxios.isAxiosError.mockReturnValue(true)

      const result = await refreshIdToken('expired-token', 'api-key')

      expect(result).toEqual({
        success: false,
        code: 'TOKEN_EXPIRED',
        name: 'FirebaseError',
        full: axiosError.response.data,
      })
    })

    it('should return generic error on unhandled exception', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'))
      mockedAxios.isAxiosError.mockReturnValue(false)

      const result = await refreshIdToken('refresh-token', 'api-key')

      expect(result).toEqual({
        success: false,
        code: 'unhandled-exception',
        name: 'FirebaseError',
      })
    })
  })

  describe('getUserInfo', () => {
    it('should return user info on success', async () => {
      const mockDecodedToken = { uid: 'user123' }
      const mockUserRecord = {
        uid: 'user123',
        email: 'test@test.com',
        emailVerified: true,
        displayName: 'Test User',
        photoURL: 'https://photo.url',
        disabled: false,
        metadata: {
          creationTime: '2024-01-01T00:00:00Z',
          lastSignInTime: '2024-01-01T00:00:00Z',
        },
        providerData: [],
      }

      const mockAuth = {
        verifyIdToken: jest.fn().mockResolvedValue(mockDecodedToken),
        getUser: jest.fn().mockResolvedValue(mockUserRecord),
      }
      mockedFirebaseModule.getAuth.mockReturnValue(mockAuth as never)

      const result = await getUserInfo('valid-token')

      expect(result).toEqual({
        uid: 'user123',
        email: 'test@test.com',
        emailVerified: true,
        displayName: 'Test User',
        photoURL: 'https://photo.url',
        disabled: false,
        metadata: {
          creationTime: '2024-01-01T00:00:00Z',
          lastSignInTime: '2024-01-01T00:00:00Z',
        },
        providerData: [],
      })
    })

    it('should return null if token is invalid', async () => {
      const mockAuth = {
        verifyIdToken: jest.fn().mockRejectedValue(new Error('Invalid token')),
      }
      mockedFirebaseModule.getAuth.mockReturnValue(mockAuth as never)

      const result = await getUserInfo('invalid-token')

      expect(result).toBeNull()
    })

    it('should return null if getUser fails', async () => {
      const mockDecodedToken = { uid: 'user123' }
      const mockAuth = {
        verifyIdToken: jest.fn().mockResolvedValue(mockDecodedToken),
        getUser: jest.fn().mockRejectedValue(new Error('User not found')),
      }
      mockedFirebaseModule.getAuth.mockReturnValue(mockAuth as never)

      const result = await getUserInfo('valid-token')

      expect(result).toBeNull()
    })
  })

  describe('sendAnalyticsEvent', () => {
    it('should return true on successful event send', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} })

      const result = await sendAnalyticsEvent(
        { client_id: 'client123', event: 'test_event', params: { key: 'value' } },
        'G-MEASUREMENT',
        'api-secret'
      )

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://www.google-analytics.com/mp/collect?measurement_id=G-MEASUREMENT&api_secret=api-secret',
        {
          client_id: 'client123',
          events: [{ name: 'test_event', params: { key: 'value' } }],
        },
        { headers: { 'Content-Type': 'application/json' } }
      )
      expect(result).toBe(true)
    })

    it('should use empty params if not provided', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} })

      await sendAnalyticsEvent(
        { client_id: 'client123', event: 'test_event' },
        'G-MEASUREMENT',
        'api-secret'
      )

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        {
          client_id: 'client123',
          events: [{ name: 'test_event', params: {} }],
        },
        expect.any(Object)
      )
    })

    it('should return false on failure', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'))

      const result = await sendAnalyticsEvent(
        { client_id: 'client123', event: 'test_event' },
        'G-MEASUREMENT',
        'api-secret'
      )

      expect(result).toBe(false)
    })
  })
})
