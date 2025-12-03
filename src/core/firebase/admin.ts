import * as admin from 'firebase-admin'

import { config } from '../config/config'
import { logger } from '../logger/logger'

let firebaseApp: admin.app.App | null = null

/**
 * Initialize Firebase Admin SDK
 * Can be initialized with credentials or use Application Default Credentials (ADC)
 */
export const initializeFirebase = (): admin.app.App => {
  if (firebaseApp) {
    return firebaseApp
  }

  try {
    firebaseApp = admin.app()
    logger.info('Firebase Admin already initialized')
    return firebaseApp
  } catch {
    try {
      // Get project ID from config
      const projectId = config.firebaseFrontendConfig?.projectId

      if (projectId) {
        // Initialize with specific project ID
        firebaseApp = admin.initializeApp({
          projectId,
        })
        logger.info(`Firebase Admin initialized for project: ${projectId}`)
      } else {
        // Fallback to default credentials
        firebaseApp = admin.initializeApp()
        logger.info('Firebase Admin initialized with default credentials')
      }

      return firebaseApp
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin:', error)
      throw error
    }
  }
}

/**
 * Get Firebase Admin instance
 */
export const getFirebaseAdmin = (): admin.app.App => {
  if (!firebaseApp) {
    return initializeFirebase()
  }
  return firebaseApp
}

/**
 * Get Firebase Auth instance
 */
export const getAuth = (): admin.auth.Auth => {
  return getFirebaseAdmin().auth()
}
