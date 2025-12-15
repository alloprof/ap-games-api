import * as fs from 'fs'
import * as path from 'path'

import * as admin from 'firebase-admin'

import { config } from '../config/config'
import { logger } from '../logger/logger'

let firebaseApp: admin.app.App | null = null

/**
 * Initialize Firebase Admin SDK
 * 1. Service account key file (if FIREBASE_SERVICE_ACCOUNT_PATH is set)
 * 2. Application Default Credentials (ADC) with optional FIREBASE_PROJECT_ID
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
      const serviceAccountPath = config.firebaseServiceAccountPath
      const projectId = config.firebaseProjectId

      // Try to initialize with service account first
      if (serviceAccountPath) {
        const absolutePath = path.isAbsolute(serviceAccountPath)
          ? serviceAccountPath
          : path.join(process.cwd(), serviceAccountPath)

        if (fs.existsSync(absolutePath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'))

          firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id,
          })

          logger.info('Firebase Admin initialized with service account')
          return firebaseApp
        }
      }

      firebaseApp = admin.initializeApp()

      logger.info(
        `Firebase Admin initialized with Application Default Credentials${projectId ? ` (project: ${projectId})` : ''}`
      )

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
