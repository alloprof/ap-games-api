import squidexConfig from './config.json'

import type { SquidexAppConfig } from './types'

export const ALLOWED_SQUIDEX_APPS: readonly string[] = squidexConfig.allowedApps

export const isAllowedSquidexApp = (app: string): boolean => ALLOWED_SQUIDEX_APPS.includes(app)

/**
 * Parse Squidex apps configuration from environment variable
 */
export const parseSquidexApps = (): Record<string, SquidexAppConfig> => {
  const configStr = process.env.SQUIDEX_APPS
  if (!configStr) {
    return {}
  }
  const parsed = JSON.parse(configStr) as Record<string, SquidexAppConfig>
  const invalidApps = Object.keys(parsed).filter((app) => !isAllowedSquidexApp(app))
  if (invalidApps.length > 0) {
    throw new Error(
      `SQUIDEX_APPS contains unsupported apps: ${invalidApps.join(
        ', '
      )}. Allowed apps: ${ALLOWED_SQUIDEX_APPS.join(', ')}`
    )
  }
  return parsed
}
