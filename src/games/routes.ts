import express from 'express'

import { config } from '../core/config/config'
import { logger } from '../core/logger/logger'
import { apiRateLimiter, authRateLimiter } from '../core/middleware/rateLimiter'

import {
  getCustomLoginToken,
  getFirestore,
  getUserFromToken,
  getUserInfo,
  loginWithEmailPassword,
  refreshIdToken,
  revokeUserTokens,
  sendAnalyticsEvent,
} from './services'

import type {
  CustomTokenRequest,
  CustomTokenResponse,
  ErrorResponse,
  FirebaseLoginRequest,
  FirebaseLoginResponse,
  FirestoreReadRequest,
  FirestoreReadResponse,
  FirestoreWriteRequest,
  FirestoreWriteResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  SendEventRequest,
  SendEventResponse,
  UserInfoRequest,
} from './types'

const router = express.Router()

/**
 * POST /login
 * Authenticate user with email and password
 */
router.post(
  '/login',
  authRateLimiter,
  async (
    req: express.Request<object, FirebaseLoginResponse | ErrorResponse, FirebaseLoginRequest>,
    res: express.Response<FirebaseLoginResponse | ErrorResponse>
  ) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          code: 'missing-credentials',
          name: 'ValidationError',
          message: 'Email and password are required',
        })
      }

      if (!config.firebaseWebApiKey) {
        return res.status(500).json({
          success: false,
          code: 'missing-firebase-api-key',
          name: 'ConfigError',
          message: 'Firebase Web API Key is not configured',
        })
      }

      const result = await loginWithEmailPassword(email, password, config.firebaseWebApiKey)
      res.json(result)
    } catch (error) {
      logger.error('Error in /login:', error)
      res.status(500).json({
        success: false,
        code: 'internal-error',
        name: 'ServerError',
        message: 'An unexpected error occurred',
      })
    }
  }
)

/**
 * POST /refresh
 * Refresh Firebase ID token using refresh token
 */
router.post(
  '/refresh',
  authRateLimiter,
  async (
    req: express.Request<object, RefreshTokenResponse | ErrorResponse, RefreshTokenRequest>,
    res: express.Response<RefreshTokenResponse | ErrorResponse>
  ) => {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          code: 'missing-refresh-token',
          name: 'ValidationError',
          message: 'Refresh token is required',
        })
      }

      if (!config.firebaseWebApiKey) {
        return res.status(500).json({
          success: false,
          code: 'missing-firebase-api-key',
          name: 'ConfigError',
          message: 'Firebase Web API Key is not configured',
        })
      }

      const result = await refreshIdToken(refreshToken, config.firebaseWebApiKey)
      res.json(result)
    } catch (error) {
      logger.error('Error in /refresh:', error)
      res.status(500).json({
        success: false,
        code: 'internal-error',
        name: 'ServerError',
        message: 'An unexpected error occurred',
      })
    }
  }
)

/**
 * POST /logout
 * Revoke all refresh tokens for the authenticated user
 */
router.post(
  '/logout',
  async (
    req: express.Request<object, unknown, UserInfoRequest>,
    res: express.Response<unknown>
  ) => {
    try {
      const { idToken } = req.body

      if (!idToken) {
        return res.status(400).json({
          success: false,
          code: 'missing-id-token',
          name: 'ValidationError',
          message: 'ID token is required',
        })
      }

      const decodedToken = await getUserFromToken(idToken)

      if (!decodedToken) {
        return res.status(401).json({
          success: false,
          code: 'invalid-token',
          name: 'AuthError',
          message: 'Invalid or expired ID token',
        })
      }

      const success = await revokeUserTokens(decodedToken.uid)

      if (!success) {
        return res.status(500).json({
          success: false,
          code: 'revocation-failed',
          name: 'ServerError',
          message: 'Failed to revoke tokens',
        })
      }

      res.json({
        success: true,
        message: 'All refresh tokens have been revoked',
      })
    } catch (error) {
      logger.error('Error in /logout:', error)
      res.status(500).json({
        success: false,
        code: 'internal-error',
        name: 'ServerError',
        message: 'An unexpected error occurred',
      })
    }
  }
)

/**
 * POST /userinfo
 * Get user information from Firebase Auth
 */
router.post(
  '/userinfo',
  async (
    req: express.Request<object, unknown, UserInfoRequest>,
    res: express.Response<unknown>
  ) => {
    try {
      const { idToken } = req.body

      if (!idToken) {
        return res.status(400).json({
          success: false,
          code: 'missing-id-token',
          name: 'ValidationError',
          message: 'ID token is required',
        })
      }

      const userInfo = await getUserInfo(idToken)

      if (!userInfo) {
        return res.status(401).json({
          success: false,
          code: 'invalid-token',
          name: 'AuthError',
          message: 'Invalid or expired ID token',
        })
      }

      res.json(userInfo)
    } catch (error) {
      logger.error('Error in /userinfo:', error)
      res.status(500).json({
        success: false,
        code: 'internal-error',
        name: 'ServerError',
        message: 'An unexpected error occurred',
      })
    }
  }
)

/**
 * POST /user-custom-token
 * Generate a custom token from an ID token
 */
router.post(
  '/user-custom-token',
  async (
    req: express.Request<object, CustomTokenResponse | ErrorResponse, CustomTokenRequest>,
    res: express.Response<CustomTokenResponse | ErrorResponse>
  ) => {
    try {
      const { idToken } = req.body

      if (!idToken) {
        return res.status(400).json({
          success: false,
          code: 'missing-id-token',
          name: 'ValidationError',
          message: 'ID token is required',
        })
      }

      const decodedToken = await getUserFromToken(idToken)

      if (!decodedToken) {
        return res.status(401).json({
          success: false,
          code: 'invalid-token',
          name: 'AuthError',
          message: 'Invalid or expired ID token',
        })
      }

      const customToken = await getCustomLoginToken(decodedToken)

      if (!customToken) {
        return res.status(500).json({
          success: false,
          code: 'custom-token-creation-failed',
          name: 'ServerError',
          message: 'Failed to create custom token',
        })
      }

      res.json({ customToken })
    } catch (error) {
      logger.error('Error in /user-custom-token:', error)
      res.status(500).json({
        success: false,
        code: 'internal-error',
        name: 'ServerError',
        message: 'An unexpected error occurred',
      })
    }
  }
)

/**
 * POST /fsread
 * Read a document from Firestore
 */
router.post(
  '/fsread',
  async (
    req: express.Request<object, FirestoreReadResponse, FirestoreReadRequest>,
    res: express.Response<FirestoreReadResponse>
  ) => {
    try {
      const { idToken, document } = req.body

      if (!idToken) {
        return res.status(400).json({
          success: false,
          code: 'missing-id-token',
          name: 'ValidationError',
          message: 'ID token is required',
        })
      }

      if (!document || !Array.isArray(document) || document.length === 0) {
        return res.status(400).json({
          success: false,
          code: 'no-target-document',
          name: 'ValidationError',
          message: 'Document path is required and must be a non-empty array',
        })
      }

      // Verify user token
      const decodedToken = await getUserFromToken(idToken)
      if (!decodedToken) {
        return res.status(401).json({
          success: false,
          code: 'invalid-token',
          name: 'AuthError',
          message: 'Invalid or expired ID token',
        })
      }

      // Read from Firestore using Admin SDK
      const db = getFirestore()
      const docRef = db.doc(document.join('/'))
      const docSnap = await docRef.get()

      if (!docSnap.exists) {
        return res.json({
          success: true,
          data: {},
        })
      }

      res.json({
        success: true,
        data: docSnap.data() as Record<string, unknown>,
      })
    } catch (error) {
      logger.error('Error in /fsread:', error)

      if (error && typeof error === 'object' && 'name' in error && error.name === 'FirebaseError') {
        return res.status(500).json({
          success: false,
          code: 'code' in error ? String(error.code) : undefined,
          name: String(error.name),
        })
      }

      res.status(500).json({
        success: false,
        code: 'internal-error',
        name: 'ServerError',
        message: 'An unexpected error occurred',
      })
    }
  }
)

/**
 * POST /fswrite
 * Write a document to Firestore
 */
router.post(
  '/fswrite',
  async (
    req: express.Request<object, FirestoreWriteResponse, FirestoreWriteRequest>,
    res: express.Response<FirestoreWriteResponse>
  ) => {
    try {
      const { idToken, document, data, options } = req.body

      if (!idToken) {
        return res.status(400).json({
          success: false,
          code: 'missing-id-token',
          name: 'ValidationError',
          message: 'ID token is required',
        })
      }

      if (!document || !Array.isArray(document) || document.length === 0) {
        return res.status(400).json({
          success: false,
          code: 'no-target-document',
          name: 'ValidationError',
          message: 'Document path is required and must be a non-empty array',
        })
      }

      if (!data || typeof data !== 'object') {
        return res.status(400).json({
          success: false,
          code: 'invalid-data',
          name: 'ValidationError',
          message: 'Data is required and must be an object',
        })
      }

      // Verify user token
      const decodedToken = await getUserFromToken(idToken)
      if (!decodedToken) {
        return res.status(401).json({
          success: false,
          code: 'invalid-token',
          name: 'AuthError',
          message: 'Invalid or expired ID token',
        })
      }

      // Write to Firestore using Admin SDK
      const db = getFirestore()
      const docRef = db.doc(document.join('/'))

      // Set document with options
      await docRef.set(data, options || {})

      res.json({
        success: true,
      })
    } catch (error) {
      logger.error('Error in /fswrite:', error)

      if (error && typeof error === 'object' && 'name' in error && error.name === 'FirebaseError') {
        return res.status(500).json({
          success: false,
          code: 'code' in error ? String(error.code) : undefined,
          name: String(error.name),
        })
      }

      res.status(500).json({
        success: false,
        code: 'internal-error',
        name: 'ServerError',
        message: 'An unexpected error occurred',
      })
    }
  }
)

/**
 * POST /sendevent
 * Send an analytics event to Google Analytics
 */
router.post(
  '/sendevent',
  apiRateLimiter,
  async (
    req: express.Request<object, SendEventResponse, SendEventRequest>,
    res: express.Response<SendEventResponse>
  ) => {
    try {
      const { idToken, client_id, event, params } = req.body

      // Verify authentication
      if (!idToken) {
        return res.status(401).json({
          success: false,
        })
      }

      const decodedToken = await getUserFromToken(idToken)
      if (!decodedToken) {
        return res.status(401).json({
          success: false,
        })
      }

      // Validate request
      if (!client_id || !event) {
        return res.status(400).json({
          success: false,
        })
      }

      const success = await sendAnalyticsEvent(
        { client_id, event, params },
        config.gamesMeasurementId,
        config.analyticsSecretKey
      )

      res.json({ success })
    } catch (error) {
      logger.error('Error in /sendevent:', error)
      res.json({ success: false })
    }
  }
)

/**
 * GET /man
 * Get API documentation
 */
router.get('/man', async (req: express.Request, res: express.Response) => {
  res.json({
    '/login': {
      status: 'implemented',
      description: 'firestore user login',
      method: 'POST',
      body: {
        email: 'user@email.example',
        password: 'password123',
      },
      returns: {
        kind: 'identitytoolkit#VerifyPasswordResponse',
        localId: 'userId',
        email: 'user@email.example',
        displayName: '',
        idToken: 'session token',
        registered: true,
        refreshToken: 'used for /refresh in order to refresh the idToken',
        expiresIn: '3600',
      },
    },
    '/refresh': {
      status: 'implemented',
      description: 'firestore refresh user session with token',
      method: 'POST',
      body: {
        refreshToken: 'token given by /login',
      },
      returns: {
        access_token: 'same as idToken',
        expires_in: '3600',
        token_type: 'Bearer',
        refresh_token: 'refreshToken given above',
        id_token: 'the idToken',
        user_id: 'user id',
        project_id: 'project id',
      },
    },
    '/userinfo': {
      status: 'implemented',
      description: 'get firestore user info from auth',
      method: 'POST',
      body: {
        idToken: 'token given by /login',
      },
      returns: {
        uid: 'userId',
        email: 'user@email.example',
        emailVerified: false,
        displayName: null,
        photoURL: null,
        disabled: false,
        metadata: {
          creationTime: 'timestamp',
          lastSignInTime: 'timestamp',
        },
        providerData: [
          {
            providerId: 'password',
            uid: 'user@email.example',
            displayName: null,
            email: 'user@email.example',
            phoneNumber: null,
            photoURL: null,
          },
        ],
      },
    },
    '/user-custom-token': {
      status: 'implemented',
      description: 'generate custom token from id token',
      method: 'POST',
      body: {
        idToken: 'token given by /login',
      },
      returns: {
        customToken: 'custom token string',
      },
    },
    '/logout': {
      status: 'implemented',
      description: 'revoke all refresh tokens for the authenticated user',
      method: 'POST',
      body: {
        idToken: 'token given by /login',
      },
      returns: {
        success: true,
        message: 'All refresh tokens have been revoked',
      },
    },
    '/fsread': {
      status: 'implemented',
      description: 'firestore read',
      method: 'POST',
      body: {
        idToken: 'user session token',
        document: ['path', 'to', 'document'],
      },
      returns: {
        success: true,
        data: {},
      },
    },
    '/fswrite': {
      status: 'implemented',
      description: 'firestore write',
      method: 'POST',
      body: {
        idToken: 'user session token',
        document: ['path', 'to', 'document'],
        data: { this: 'will be written to the document' },
        options: {
          merge: true,
          description: 'any property supported by firestore set()',
        },
      },
      returns: {
        success: true,
      },
    },
    '/sendevent': {
      status: 'implemented',
      description: 'send analytics event (requires authentication)',
      method: 'POST',
      body: {
        idToken: 'user session token',
        client_id: 'unique identifier for the device sending the event',
        event: 'string',
        params: {
          customParam: 'custom value',
        },
      },
      returns: {
        success: true,
      },
    },
  })
})

export { router as gamesRouter }
