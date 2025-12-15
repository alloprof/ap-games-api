export interface SquidexAppConfig {
  clientId: string
  clientSecret: string
  url?: string
}

/**
 * Parse Squidex apps configuration from environment variable
 */
export const parseSquidexApps = (): Record<string, SquidexAppConfig> => {
  const configStr = process.env.SQUIDEX_APPS
  if (!configStr) {
    return {}
  }
  try {
    return JSON.parse(configStr)
  } catch {
    return {}
  }
}
