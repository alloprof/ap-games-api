import * as fs from 'fs'
import * as path from 'path'

import { LogLevel } from 'bunyan'
import dotenv from 'dotenv'

dotenv.config()

interface FirebaseFrontendConfig {
  apiKey: string
  authDomain: string
  databaseURL: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId: string
}

interface ExerciserTypes {
  VOCABULARY: string
  MATHEMATICS: string
}

export interface SquidexAppConfig {
  clientId: string
  clientSecret: string
  url?: string
}

interface GamesConfig {
  CALLCENTER_BUCKET?: string
  STORAGE_BUCKET?: string
  TWILIO_SCHEDULE?: string
  IPSTACK_API_KEY?: string
  INBOUND_MMS_TOPIC?: string
  TWILIO_ACCOUNT_SID?: string
  TWILIO_AUTH_TOKEN?: string
  TWILIO_CHAT_SERVICE_SID?: string
  TWILIO_PROXY_SERVICE?: string
  TWILIO_WORKSPACE_SID?: string
  TWILIO_TASKQUEUE_SID?: string
  SIB_KEY?: string
  SIB_KEY_STG?: string
  FUNCTION_ENVIRONMENT?: string
  ANALYTICS_SECRET_KEY?: string
  GAMES_MEASUREMENT_ID?: string
  FIREBASE_FRONTEND_CONFIG?: FirebaseFrontendConfig
  TEXT_TO_SPEECH_INSTANCE?: string
  EXERCISER_TYPES?: ExerciserTypes
  SQUIDEX_DEFAULT_URL?: string
  SQUIDEX_DEFAULT_APP?: string
  SQUIDEX_APPS?: Record<string, SquidexAppConfig>
}

/**
 * Load configuration from JSON file based on ENV variable
 * Automatically loads config/games.{ENV}.json
 * Falls back to GAMES_CONFIG_PATH if specified
 */
const loadConfigFromFile = (): GamesConfig | null => {
  let configPath: string

  // Priority 1: Explicit GAMES_CONFIG_PATH
  if (process.env.GAMES_CONFIG_PATH) {
    configPath = process.env.GAMES_CONFIG_PATH
  }
  // Priority 2: Auto-detect based on ENV variable
  else if (process.env.ENV) {
    configPath = `config/games.${process.env.ENV}.json`
  }
  // No config path available
  else {
    return null
  }

  try {
    const absolutePath = path.isAbsolute(configPath)
      ? configPath
      : path.join(process.cwd(), configPath)

    if (!fs.existsSync(absolutePath)) {
      console.warn(`Games config file not found: ${absolutePath}`)
      return null
    }

    const fileContent = fs.readFileSync(absolutePath, 'utf-8')
    const config = JSON.parse(fileContent)
    console.log(`Loaded games config from: ${configPath}`)
    return config
  } catch (error) {
    console.error('Failed to load games config file:', error)
    return null
  }
}

// Load config from file (if provided)
const fileConfig = loadConfigFromFile()

const parseFirebaseFrontendConfig = (): FirebaseFrontendConfig => {
  // Priority: file config > env variable
  if (fileConfig?.FIREBASE_FRONTEND_CONFIG) {
    return fileConfig.FIREBASE_FRONTEND_CONFIG
  }

  const configStr = process.env.FIREBASE_FRONTEND_CONFIG
  if (!configStr) {
    return {
      apiKey: '',
      authDomain: '',
      databaseURL: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      measurementId: '',
    }
  }
  try {
    return JSON.parse(configStr)
  } catch {
    return {
      apiKey: '',
      authDomain: '',
      databaseURL: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      measurementId: '',
    }
  }
}

const parseExerciserTypes = (): ExerciserTypes => {
  // Priority: file config > env variable
  if (fileConfig?.EXERCISER_TYPES) {
    return fileConfig.EXERCISER_TYPES
  }

  const configStr = process.env.EXERCISER_TYPES
  if (!configStr) {
    return {
      VOCABULARY: 'apexerciserexample',
      MATHEMATICS: 'apemath',
    }
  }
  try {
    return JSON.parse(configStr)
  } catch {
    return {
      VOCABULARY: 'apexerciserexample',
      MATHEMATICS: 'apemath',
    }
  }
}

/**
 * Get configuration value with priority: file config > env variable > default
 */
const getConfigValue = (
  fileValue: string | undefined,
  envKey: string,
  defaultValue = ''
): string => {
  return fileValue || process.env[envKey] || defaultValue
}

export const config = {
  apiName: process.env.API_NAME || 'ap-api',
  logLevel: (process.env.LOG_LEVEL || 'info') as LogLevel,
  enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true',
  bunyanLogging: process.env.BUNYAN_LOGGING === 'true',
  basePath: process.env.BASE_PATH || '/',
  port: parseInt(process.env.PORT || '3000'),

  // Firebase & Games Configuration
  callcenterBucket: getConfigValue(fileConfig?.CALLCENTER_BUCKET, 'CALLCENTER_BUCKET'),
  storageBucket: getConfigValue(fileConfig?.STORAGE_BUCKET, 'STORAGE_BUCKET'),
  twilioSchedule: getConfigValue(fileConfig?.TWILIO_SCHEDULE, 'TWILIO_SCHEDULE'),
  ipstackApiKey: getConfigValue(fileConfig?.IPSTACK_API_KEY, 'IPSTACK_API_KEY'),
  inboundMmsTopic: getConfigValue(fileConfig?.INBOUND_MMS_TOPIC, 'INBOUND_MMS_TOPIC'),
  twilioAccountSid: getConfigValue(fileConfig?.TWILIO_ACCOUNT_SID, 'TWILIO_ACCOUNT_SID'),
  twilioAuthToken: getConfigValue(fileConfig?.TWILIO_AUTH_TOKEN, 'TWILIO_AUTH_TOKEN'),
  twilioChatServiceSid: getConfigValue(
    fileConfig?.TWILIO_CHAT_SERVICE_SID,
    'TWILIO_CHAT_SERVICE_SID'
  ),
  twilioProxyService: getConfigValue(fileConfig?.TWILIO_PROXY_SERVICE, 'TWILIO_PROXY_SERVICE'),
  twilioWorkspaceSid: getConfigValue(fileConfig?.TWILIO_WORKSPACE_SID, 'TWILIO_WORKSPACE_SID'),
  twilioTaskqueueSid: getConfigValue(fileConfig?.TWILIO_TASKQUEUE_SID, 'TWILIO_TASKQUEUE_SID'),
  sibKey: getConfigValue(fileConfig?.SIB_KEY, 'SIB_KEY'),
  sibKeyStg: getConfigValue(fileConfig?.SIB_KEY_STG, 'SIB_KEY_STG'),
  functionEnvironment: getConfigValue(
    fileConfig?.FUNCTION_ENVIRONMENT,
    'FUNCTION_ENVIRONMENT',
    'dev'
  ),
  analyticsSecretKey: getConfigValue(fileConfig?.ANALYTICS_SECRET_KEY, 'ANALYTICS_SECRET_KEY'),
  gamesMeasurementId: getConfigValue(fileConfig?.GAMES_MEASUREMENT_ID, 'GAMES_MEASUREMENT_ID'),
  firebaseFrontendConfig: parseFirebaseFrontendConfig(),
  firebaseApiKey: parseFirebaseFrontendConfig().apiKey,
  textToSpeechInstance: getConfigValue(
    fileConfig?.TEXT_TO_SPEECH_INSTANCE,
    'TEXT_TO_SPEECH_INSTANCE'
  ),
  exerciserTypes: parseExerciserTypes(),

  // Squidex Configuration
  squidexDefaultUrl: getConfigValue(fileConfig?.SQUIDEX_DEFAULT_URL, 'SQUIDEX_DEFAULT_URL'),
  squidexDefaultApp: getConfigValue(fileConfig?.SQUIDEX_DEFAULT_APP, 'SQUIDEX_DEFAULT_APP'),
  squidexApps: fileConfig?.SQUIDEX_APPS || {},

  // Squidex Helper Functions
  getSquidexDefaultApp(): string {
    return this.squidexDefaultApp
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
        `App "${appName}" not found in configuration. Available apps: ${this.getSquidexAvailableApps().join(', ')}`
      )
    }

    return appConfig.url || this.squidexDefaultUrl
  },

  getSquidexClientCredentials(app?: string): SquidexAppConfig {
    const appName = app || this.squidexDefaultApp
    const appConfig = this.squidexApps[appName]

    if (!appConfig) {
      throw new Error(
        `App "${appName}" not found in configuration. Available apps: ${this.getSquidexAvailableApps().join(', ')}`
      )
    }

    return appConfig
  },

  hasSquidexApp(app: string): boolean {
    return app in this.squidexApps
  },
}
