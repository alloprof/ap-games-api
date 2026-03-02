import express, { Request, Response } from 'express'

import { config } from '../core/config/config'
import { logger } from '../core/logger/logger'

import { SquidexClient } from './client'
import { validateSchema, validateContentId } from './middleware'
import { SquidexConfig } from './types'

const router = express.Router()

// Initialize Squidex clients (one per app)
const squidexClients: Map<string, SquidexClient> = new Map()

/**
 * Get or create a Squidex client for the specified app
 */
function getClient(app?: string): SquidexClient {
  const appName = app || config.getSquidexDefaultApp()

  // Validate app exists
  if (!config.hasSquidexApp(appName)) {
    throw new Error(
      `App "${appName}" not found. Available apps: ${config.getSquidexAvailableApps().join(', ')}`
    )
  }

  // Return cached client if exists
  if (squidexClients.has(appName)) {
    return squidexClients.get(appName)!
  }

  // Create new client
  const credentials = config.getSquidexClientCredentials(appName)
  const squidexConfig: SquidexConfig = {
    appName,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    url: config.getSquidexAppUrl(appName),
  }

  const client = new SquidexClient(squidexConfig)
  squidexClients.set(appName, client)
  return client
}

/**
 * Extract app parameter from request and return client
 */
function getClientFromRequest(req: Request): SquidexClient {
  const app = req.query.app as string | undefined
  return getClient(app)
}

/**
 * Get app name from request (for logging)
 */
function getAppName(req: Request): string {
  return (req.query.app as string) || config.getSquidexDefaultApp()
}

// Get content list from Squidex (read-only)
router.get('/content/:schema', validateSchema, async (req: Request, res: Response) => {
  try {
    const client = getClientFromRequest(req)
    const { schema } = req.params
    const { app: _app, ...query } = req.query // Remove app from query params

    logger.info(`Fetching content from schema: ${schema} (app: ${getAppName(req)})`)
    const content = await client.getContent(schema, query)

    res.status(200).json(content)
  } catch (error) {
    logger.error('Failed to fetch content:', error)
    res.status(500).json({ error: 'Failed to fetch content' })
  }
})

// Get single content item (read-only)
router.get(
  '/content/:schema/:id',
  validateSchema,
  validateContentId,
  async (req: Request, res: Response) => {
    try {
      const client = getClientFromRequest(req)
      const { schema, id } = req.params

      logger.info(`Fetching content ${id} from schema: ${schema} (app: ${getAppName(req)})`)
      const content = await client.getContentById(schema, id)

      res.status(200).json(content)
    } catch (error) {
      logger.error('Failed to fetch content by id:', error)
      res.status(500).json({ error: 'Failed to fetch content' })
    }
  }
)

export { router as squidexRouter }
