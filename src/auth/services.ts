import { getAuth } from '../core/firebase'
import { logger } from '../core/logger/logger'

import type { DecodedIdToken } from 'firebase-admin/auth'

/**
 * Verify and decode a Firebase ID token
 * @param token - Firebase ID token to verify
 * @returns Decoded token information or null if invalid
 */
export const getUserFromToken = async (token: string): Promise<DecodedIdToken | null> => {
  try {
    const auth = getAuth()
    const decodedToken = await auth.verifyIdToken(token)
    return decodedToken
  } catch (error) {
    logger.error('Failed to verify token:', error)
    return null
  }
}

/**
 * Create a custom token for a user
 * @param decodedToken - Decoded Firebase ID token
 * @returns Custom token string or null if failed
 */
export const getCustomLoginToken = async (decodedToken: DecodedIdToken): Promise<string | null> => {
  try {
    const auth = getAuth()
    const customToken = await auth.createCustomToken(decodedToken.uid)
    return customToken
  } catch (error) {
    logger.error('Failed to create custom token:', error)
    return null
  }
}
