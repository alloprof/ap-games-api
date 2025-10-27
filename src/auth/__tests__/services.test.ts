import * as firebase from '../../core/firebase'
import { getCustomLoginToken, getUserFromToken } from '../services'

import type { Auth, DecodedIdToken } from 'firebase-admin/auth'

// Mock the firebase module
jest.mock('../../core/firebase')

const mockGetAuth = firebase.getAuth as jest.MockedFunction<typeof firebase.getAuth>

describe('Auth Services', () => {
  let mockAuth: Partial<Auth>

  beforeEach(() => {
    jest.clearAllMocks()

    mockAuth = {
      verifyIdToken: jest.fn(),
      createCustomToken: jest.fn(),
    }

    mockGetAuth.mockReturnValue(mockAuth as Auth)
  })

  describe('getUserFromToken', () => {
    it('should return decoded token on success', async () => {
      const mockToken = 'valid-token'
      const mockDecodedToken: DecodedIdToken = {
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

      ;(mockAuth.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedToken)

      const result = await getUserFromToken(mockToken)

      expect(result).toEqual(mockDecodedToken)
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith(mockToken)
    })

    it('should return null on error', async () => {
      const mockToken = 'invalid-token'
      ;(mockAuth.verifyIdToken as jest.Mock).mockRejectedValue(new Error('Invalid token'))

      const result = await getUserFromToken(mockToken)

      expect(result).toBeNull()
    })
  })

  describe('getCustomLoginToken', () => {
    it('should return custom token on success', async () => {
      const mockDecodedToken: DecodedIdToken = {
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
      const mockCustomToken = 'custom-token-string'

      ;(mockAuth.createCustomToken as jest.Mock).mockResolvedValue(mockCustomToken)

      const result = await getCustomLoginToken(mockDecodedToken)

      expect(result).toBe(mockCustomToken)
      expect(mockAuth.createCustomToken).toHaveBeenCalledWith('test-uid')
    })

    it('should return null on error', async () => {
      const mockDecodedToken: DecodedIdToken = {
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

      ;(mockAuth.createCustomToken as jest.Mock).mockRejectedValue(
        new Error('Failed to create token')
      )

      const result = await getCustomLoginToken(mockDecodedToken)

      expect(result).toBeNull()
    })
  })
})

export {}
