import fs from 'fs'
import path from 'path'

import { logger } from '../core/logger/logger'

/* =========================================
 * Types
 * ========================================= */
export type Environment = 'local' | 'staging' | 'production'

export interface SquidexConfig {
  SQUIDEX_CLIENT_ID: string
  SQUIDEX_CLIENT_SECRET: string
  SQUIDEX_EXERCISERS_APP: string
  SQUIDEX_GRAPHQL_URL: string
  SQUIDEX_IDENT_URL: string
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
      return env as Environment
    default:
      return 'local'
  }
}

/* =========================================
 * Config loader
 * ========================================= */
let cachedConfig: SquidexConfig | null = null

/**
 * Load environment-specific configuration object from:
 *   src/core/config/envs/<environment>.config.json
 * Fallbacks to <environment>.config.example.json if main file is missing.
 */
export const loadEnvConfig = <T = SquidexConfig>(environment: Environment): T => {
  try {
    const baseDir = path.join(process.cwd(), 'src', 'squidex', 'envs')
    const configPath = path.join(baseDir, `${environment}.config.json`)
    const examplePath = path.join(baseDir, `${environment}.config.example.json`)

    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8')
      const parsed = JSON.parse(content) as T
      logger.info(`Loaded ${environment} configuration from ${configPath}`)
      return parsed
    }

    logger.warn(`Config file not found: ${configPath}, using example config if available`)
    if (fs.existsSync(examplePath)) {
      const content = fs.readFileSync(examplePath, 'utf-8')
      const parsed = JSON.parse(content) as T
      logger.info(`Loaded ${environment} example configuration from ${examplePath}`)
      return parsed
    }

    throw new Error(`Neither config nor example config found for environment: ${environment}`)
  } catch (error) {
    logger.error(`Failed to load config for environment ${environment}:`, error)
    throw error
  }
}

/**
 * Get configuration for current environment (with simple in-memory cache).
 */
export const getEnvConfig = <T = SquidexConfig>(): T => {
  if (cachedConfig) return cachedConfig as unknown as T
  const environment = getEnvironment()
  const cfg = loadEnvConfig<T>(environment)
  // Cache only if it matches SquidexConfig shape (best-effort)
  cachedConfig = cfg as unknown as SquidexConfig
  return cfg
}

/* =========================================
 * Squidex helpers
 * ========================================= */
const config: SquidexConfig = getEnvConfig<SquidexConfig>()

/**
 * Build the GraphQL URL for a specific Squidex app.
 * Replaces "{{app}}" in SQUIDEX_GRAPHQL_URL by provided app or default app.
 */
export const getGraphUrl = (app?: string): string => {
  const appName = app || config.SQUIDEX_EXERCISERS_APP
  return config.SQUIDEX_GRAPHQL_URL.replace('{{app}}', appName)
}

/** Identity URL for authentication */
export const getIdentUrl = (): string => config.SQUIDEX_IDENT_URL

/** Client credentials */
export const getClientCredentials = () => ({
  clientId: config.SQUIDEX_CLIENT_ID,
  clientSecret: config.SQUIDEX_CLIENT_SECRET,
})

/* =========================================
 * Export full config + helpers
 * ========================================= */
export const squidexConfig = {
  ...config,
  getGraphUrl,
  getIdentUrl,
  getClientCredentials,
}
