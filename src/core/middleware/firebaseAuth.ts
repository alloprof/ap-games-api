import { Request, Response, NextFunction } from 'express'

import { getAuth } from '../firebase'
import { logger } from '../logger/logger'

import type { DecodedIdToken } from 'firebase-admin/auth'

/**
 * Middleware that verifies the Firebase ID token from req.body.idToken.
 * On success, attaches the decoded token to res.locals.decodedToken.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { idToken } = req.body

  if (!idToken) {
    return res.status(400).json({
      success: false,
      code: 'missing-id-token',
      name: 'ValidationError',
      message: 'ID token is required',
    })
  }

  try {
    const auth = getAuth()
    const decodedToken = await auth.verifyIdToken(idToken, true)
    res.locals.decodedToken = decodedToken
    next()
  } catch (error) {
    logger.error('Failed to verify token:', error)
    return res.status(401).json({
      success: false,
      code: 'invalid-token',
      name: 'AuthError',
      message: 'Invalid or expired ID token',
    })
  }
}

/**
 * Helper to retrieve the decoded token set by requireAuth middleware.
 */
export function getDecodedToken(res: Response): DecodedIdToken {
  return res.locals.decodedToken as DecodedIdToken
}
