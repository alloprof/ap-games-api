import * as admin from 'firebase-admin'

import { getAuth, getFirebaseAdmin, initializeFirebase } from '../admin'

// Mock firebase-admin
jest.mock('firebase-admin', () => {
  const mockApp = {
    auth: jest.fn(),
  }

  return {
    app: jest.fn(() => mockApp),
    initializeApp: jest.fn(() => mockApp),
    credential: {
      cert: jest.fn(),
    },
    auth: jest.fn(),
  }
})

describe('Firebase Admin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initializeFirebase', () => {
    it('should initialize Firebase Admin', () => {
      const app = initializeFirebase()
      expect(app).toBeDefined()
      expect(app.auth).toBeDefined()
    })
  })

  describe('getFirebaseAdmin', () => {
    it('should return Firebase Admin instance', () => {
      const app = getFirebaseAdmin()
      expect(app).toBeDefined()
    })
  })

  describe('getAuth', () => {
    it('should return Firebase Auth instance', () => {
      const mockAuth = {}
      ;(admin.app().auth as jest.Mock).mockReturnValue(mockAuth)

      const auth = getAuth()
      expect(auth).toBeDefined()
    })
  })
})

export {}
