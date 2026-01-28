import { LogLevel } from 'bunyan'
import dotenv from 'dotenv'

import { parseSquidexApps, ALLOWED_SQUIDEX_APPS, isAllowedSquidexApp } from '../../squidex/utils'

import type { SquidexAppConfig } from '../../squidex/types'

dotenv.config()

interface Config {
  apiName: string
  logLevel: LogLevel
  enableRequestLogging: boolean
  bunyanLogging: boolean
  basePath: string
  port: number
  analyticsSecretKey: string
  gamesMeasurementId: string
  firebaseProjectId: string
  firebaseServiceAccountPath: string
  firebaseWebApiKey: string
  squidexDefaultUrl: string
  squidexDefaultApp: string
  squidexApps: Record<string, SquidexAppConfig>
  getSquidexDefaultApp(): string
  getSquidexAllowedApps(): string[]
  getSquidexAvailableApps(): string[]
  getSquidexDefaultUrl(): string
  getSquidexAppUrl(app?: string): string
  getSquidexClientCredentials(app?: string): SquidexAppConfig
  hasSquidexApp(app: string): boolean
}

export const config: Config = {
  apiName: process.env.API_NAME || 'ap-api',
  logLevel: (process.env.LOG_LEVEL || 'info') as LogLevel,
  enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true',
  bunyanLogging: process.env.BUNYAN_LOGGING === 'true',
  basePath: process.env.BASE_PATH || '/',
  port: parseInt(process.env.PORT || '3000'),

  // Analytics Configuration
  analyticsSecretKey: process.env.ANALYTICS_SECRET_KEY || '',
  gamesMeasurementId: process.env.GAMES_MEASUREMENT_ID || '',

  // Firebase Configuration
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
  firebaseWebApiKey: process.env.FIREBASE_WEB_API_KEY || '',

  // Squidex Configuration
  squidexDefaultUrl: process.env.SQUIDEX_URL || process.env.SQUIDEX_DEFAULT_URL || '',
  squidexDefaultApp: process.env.SQUIDEX_DEFAULT_APP || '',
  squidexApps: parseSquidexApps(),

  // Squidex Helper Functions
  getSquidexDefaultApp(): string {
    return this.squidexDefaultApp
  },

  getSquidexAllowedApps(): string[] {
    return [...ALLOWED_SQUIDEX_APPS]
  },

  getSquidexAvailableApps(): string[] {
    return Object.keys(this.squidexApps)
  },

  getSquidexDefaultUrl(): string {
    return this.squidexDefaultUrl
  },

  getSquidexAppUrl(app?: string): string {
    const appName = app || this.squidexDefaultApp
    const appConfig = this.squidexApps[appName]

    if (!appConfig) {
      throw new Error(
        `App "${appName}" not found in configuration. Allowed apps: ${this.getSquidexAllowedApps().join(
          ', '
        )}. Configured apps: ${this.getSquidexAvailableApps().join(', ')}`
      )
    }

    return appConfig.url || this.squidexDefaultUrl
  },

  getSquidexClientCredentials(app?: string): SquidexAppConfig {
    const appName = app || this.squidexDefaultApp
    const appConfig = this.squidexApps[appName]

    if (!appConfig) {
      throw new Error(
        `App "${appName}" not found in configuration. Allowed apps: ${this.getSquidexAllowedApps().join(
          ', '
        )}. Configured apps: ${this.getSquidexAvailableApps().join(', ')}`
      )
    }

    return appConfig
  },

  hasSquidexApp(app: string): boolean {
    return isAllowedSquidexApp(app) && app in this.squidexApps
  },
}
