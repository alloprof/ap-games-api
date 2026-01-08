import axios from 'axios'

import { getAuth, getFirebaseAdmin } from '../core/firebase'
import { logger } from '../core/logger/logger'

import type { ErrorResponse, FirebaseLoginResponse, RefreshTokenResponse } from './types'
import type { DecodedIdToken } from 'firebase-admin/auth'

/**
 * Get Firestore instance from Admin SDK
 */
export const getFirestore = () => {
  return getFirebaseAdmin().firestore()
}

/**
 * Verify and decode a Firebase ID token
 * Checks if the user's tokens have been revoked
 */
export const getUserFromToken = async (token: string): Promise<DecodedIdToken | null> => {
  try {
    const auth = getAuth()
    // checkRevoked = true ensures revoked tokens are rejected immediately
    const decodedToken = await auth.verifyIdToken(token, true)
    return decodedToken
  } catch (error) {
    logger.error('Failed to verify token:', error)
    return null
  }
}

/**
 * Create a custom token for a user
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

/**
 * Revoke all refresh tokens for a user (logout)
 */
export const revokeUserTokens = async (uid: string): Promise<boolean> => {
  try {
    const auth = getAuth()
    await auth.revokeRefreshTokens(uid)
    logger.info(`Successfully revoked tokens for user: ${uid}`)
    return true
  } catch (error) {
    logger.error('Failed to revoke tokens:', error)
    return false
  }
}

/**
 * Login with Firebase Authentication REST API
 */
export const loginWithEmailPassword = async (
  email: string,
  password: string,
  apiKey: string
): Promise<FirebaseLoginResponse | ErrorResponse> => {
  try {
    const response = await axios.post<FirebaseLoginResponse>(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        email,
        password,
        returnSecureToken: true,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as {
        error?: { message?: string; [key: string]: unknown }
      }
      return {
        success: false,
        code: errorData.error?.message || 'unknown-error',
        name: 'FirebaseError',
        full: errorData,
      }
    }
    return {
      success: false,
      code: 'unhandled-exception',
      name: 'FirebaseError',
    }
  }
}

/**
 * Refresh Firebase ID token using refresh token
 */
export const refreshIdToken = async (
  refreshToken: string,
  apiKey: string
): Promise<RefreshTokenResponse | ErrorResponse> => {
  try {
    const response = await axios.post<RefreshTokenResponse>(
      `https://securetoken.googleapis.com/v1/token?key=${apiKey}`,
      {
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as {
        error?: { message?: string; [key: string]: unknown }
      }
      return {
        success: false,
        code: errorData.error?.message || 'unknown-error',
        name: 'FirebaseError',
        full: errorData,
      }
    }
    return {
      success: false,
      code: 'unhandled-exception',
      name: 'FirebaseError',
    }
  }
}

/**
 * Get user info from Firebase Auth
 */
export const getUserInfo = async (idToken: string) => {
  try {
    const decodedToken = await getUserFromToken(idToken)
    if (!decodedToken) {
      return null
    }

    const auth = getAuth()
    const userRecord = await auth.getUser(decodedToken.uid)

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      disabled: userRecord.disabled,
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
      },
      providerData: userRecord.providerData,
    }
  } catch (error) {
    logger.error('Failed to get user info:', error)
    return null
  }
}

/**
 * Send analytics event to Google Analytics Measurement Protocol
 */
export const sendAnalyticsEvent = async (
  eventData: { client_id: string; event: string; params?: Record<string, unknown> },
  measurementId: string,
  apiSecret: string
): Promise<boolean> => {
  try {
    await axios.post(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        client_id: eventData.client_id,
        events: [
          {
            name: eventData.event,
            params: eventData.params || {},
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    return true
  } catch (error) {
    logger.error('Failed to send analytics event:', error)
    return false
  }
}
