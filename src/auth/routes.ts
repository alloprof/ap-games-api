import express from 'express'

import { logger } from '../core/logger/logger'

import { getCustomLoginToken, getUserFromToken } from './services'

import type { CustomTokenRequest, CustomTokenResponse, ErrorResponse } from './types'

const router = express.Router()

/**
 * POST /user-custom-token
 * Generate a custom token from a Firebase ID token
 *
 * Request body:
 * {
 *   "idToken": "firebase-id-token"
 * }
 *
 * Response:
 * Success: { "customToken": "custom-token-string" }
 * Error: { "success": false, "code": "error-code", "name": "ErrorName" }
 */
router.post(
  '/user-custom-token',
  async (req: express.Request, res: express.Response<CustomTokenResponse | ErrorResponse>) => {
    try {
      const { idToken } = req.body as CustomTokenRequest

      if (!idToken) {
        return res.status(400).json({
          success: false,
          code: 'missing-id-token',
          message: 'idToken is required in request body',
        })
      }

      // Verify the ID token
      const decodedToken = await getUserFromToken(idToken)

      if (!decodedToken) {
        return res.status(401).json({
          success: false,
          code: 'invalid-id-token',
          message: 'Failed to verify ID token',
        })
      }

      // Create custom token
      const customToken = await getCustomLoginToken(decodedToken)

      if (!customToken) {
        return res.status(500).json({
          success: false,
          code: 'custom-token-creation-failed',
          message: 'Failed to create custom token',
        })
      }

      res.json({ customToken })
    } catch (e) {
      logger.error('Error in /user-custom-token:', e)

      // Firebase errors
      if (e && typeof e === 'object' && 'name' in e && e.name === 'FirebaseError') {
        return res.status(500).json({
          success: false,
          code: 'code' in e ? String(e.code) : undefined,
          name: String(e.name),
        })
      }

      // Generic error
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
      })
    }
  }
)

export { router as authRouter }
