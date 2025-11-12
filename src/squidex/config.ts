import { logger } from '../core/logger/logger'

/* =========================================
 * Types
 * ========================================= */
export type Environment = 'local' | 'staging' | 'production' | 'gustave'

export interface SquidexAppConfig {
  clientId: string
  clientSecret: string
  url?: string // URL to Squidex installation (cloud.squidex.io by default)
}

export interface SquidexEnvConfig {
  defaultUrl: string
  defaultApp: string
  apps: Record<string, SquidexAppConfig>
}

/* =========================================
 * Environment helpers
 * ========================================= */
/**
 * Get the current environment from ENV
 * Defaults to 'local' if ENV is not set or invalid.
 */
export const getEnvironment = (): Environment => {
  const env = (process.env.ENV || '').toLowerCase()
  switch (env) {
    case 'production':
    case 'staging':
    case 'local':
    case 'gustave':
      return env as Environment
    default:
      return 'local'
  }
}

/* =========================================
 * Config loader
 * ========================================= */
let cachedConfig: SquidexEnvConfig | null = null

/**
 * Load environment-specific configuration from TypeScript module
 */
export const loadEnvConfig = (environment: Environment): SquidexEnvConfig => {
  try {
    // Dynamic require based on environment

    const configModule = require(`./envs/${environment}.config`)
    logger.info(`Loaded ${environment} configuration`)
    return configModule.config as SquidexEnvConfig
  } catch (error) {
    logger.error(`Failed to load config for environment ${environment}:`, error)
    throw error
  }
}

/**
 * Get configuration for current environment (with simple in-memory cache).
 */
export const getEnvConfig = (): SquidexEnvConfig => {
  if (cachedConfig) return cachedConfig
  const environment = getEnvironment()
  const cfg = loadEnvConfig(environment)
  cachedConfig = cfg
  return cfg
}

/* =========================================
 * Squidex helpers
 * ========================================= */
const config: SquidexEnvConfig = getEnvConfig()

/** Get default app name */
export const getDefaultApp = (): string => config.defaultApp

/** Get list of available apps */
export const getAvailableApps = (): string[] => Object.keys(config.apps)

/** Get default URL */
export const getDefaultUrl = (): string => config.defaultUrl

/** Get URL for a specific app (uses app's URL or default) */
export const getAppUrl = (app?: string): string => {
  const appName = app || config.defaultApp
  const appConfig = config.apps[appName]

  if (!appConfig) {
    throw new Error(
      `App "${appName}" not found in configuration. Available apps: ${getAvailableApps().join(', ')}`
    )
  }

  return appConfig.url || config.defaultUrl
}

/** Get client credentials for a specific app */
export const getClientCredentials = (app?: string): SquidexAppConfig => {
  const appName = app || config.defaultApp
  const appConfig = config.apps[appName]

  if (!appConfig) {
    throw new Error(
      `App "${appName}" not found in configuration. Available apps: ${getAvailableApps().join(', ')}`
    )
  }

  return appConfig
}

/** Check if an app exists in configuration */
export const hasApp = (app: string): boolean => {
  return app in config.apps
}

/* =========================================
 * Export full config + helpers
 * ========================================= */
export const squidexConfig = {
  ...config,
  getDefaultApp,
  getDefaultUrl,
  getAppUrl,
  getAvailableApps,
  getClientCredentials,
  hasApp,
}
