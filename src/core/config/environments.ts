/**
 * Centralized environment configuration
 * This enum defines all valid environments across the application
 */
export enum Environment {
  Dev = 'dev',
  Local = 'local',
  Staging = 'staging',
  Production = 'production',
  Gustave = 'gustave',
}

/**
 * Type for environment values
 */
export type EnvironmentValue = `${Environment}`

/**
 * Get the current environment from ENV variable
 * Defaults to 'dev' if ENV is not set or invalid.
 * Returns the string value of the environment
 */
export const getCurrentEnvironment = (): string => {
  const env = (process.env.ENV || '').toLowerCase()

  // Check if the environment is valid
  const validEnvironments = Object.values(Environment) as string[]
  if (validEnvironments.includes(env)) {
    return env
  }

  // Default to dev
  return Environment.Dev
}

/**
 * Check if a string is a valid environment
 */
export const isValidEnvironment = (env: string): env is Environment => {
  const validEnvironments = Object.values(Environment) as string[]
  return validEnvironments.includes(env.toLowerCase())
}
