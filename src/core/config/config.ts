import { LogLevel } from 'bunyan'
import dotenv from 'dotenv'
dotenv.config()

export const config = {
  apiName: process.env.API_NAME || 'ap-api',
  logLevel: (process.env.LOG_LEVEL || 'info') as LogLevel,
  enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true',
  bunyanLogging: process.env.BUNYAN_LOGGING === 'true',
  basePath: process.env.BASE_PATH || '/',
  port: parseInt(process.env.PORT || '3000'),
}
