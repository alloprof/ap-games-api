import { Request, Response, NextFunction } from 'express'

import { logger } from '../logger/logger'

/**
 * API keys configured via SQUIDEX_API_KEYS env variable.
 * Format: JSON object mapping app name to API key.
 * Example: {"grimoire-2":"key1","ap-pronom-ei":"key2"}
 */
function loadApiKeys(): Record<string, string> {
  const raw = process.env.SQUIDEX_API_KEYS
  if (!raw) {
    logger.warn('SQUIDEX_API_KEYS is not set — all Squidex requests will be rejected')
    return {}
  }
  try {
    return JSON.parse(raw)
  } catch {
    logger.error('SQUIDEX_API_KEYS is not valid JSON')
    return {}
  }
}

const apiKeys = loadApiKeys()

/**
 * Middleware that validates the X-API-Key header against configured keys.
 * On success, sets req.headers['x-app-name'] to the matched app name.
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-api-key'] as string | undefined

  if (!key) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing X-API-Key header',
    })
  }

  const entry = Object.entries(apiKeys).find(([, v]) => v === key)
  if (!entry) {
    logger.warn(`Invalid API key attempt from ${req.ip}`)
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key',
    })
  }

  req.headers['x-app-name'] = entry[0]
  next()
}
