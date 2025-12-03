import express, { Request, Response } from 'express'

import { config } from '../core/config/config'
import { logger } from '../core/logger/logger'

import {
  SquidexClient,
  CreateContentOptions,
  UpdateContentOptions,
  DeleteContentOptions,
} from './client'
import { validateSchema, validateContentId, validateContentData } from './middleware'
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

// Get configuration info (for debugging/testing)
router.get('/config', (_req: Request, res: Response) => {
  res.status(200).json({
    defaultUrl: config.getSquidexDefaultUrl(),
    defaultApp: config.getSquidexDefaultApp(),
    availableApps: config.getSquidexAvailableApps(),
    apps: config.squidexApps,
  })
})

// Get content from Squidex
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

// Get single content item
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

// Create content
router.post(
  '/content/:schema',
  validateSchema,
  validateContentData,
  async (req: Request, res: Response) => {
    try {
      const client = getClientFromRequest(req)
      const { schema } = req.params
      const data = req.body
      const options: CreateContentOptions = {
        publish: req.query.publish === 'true',
        id: req.query.id as string | undefined,
      }

      logger.info(`Creating content in schema: ${schema} (app: ${getAppName(req)})`)
      const content = await client.createContent(schema, data, options)

      res.status(201).json(content)
    } catch (error) {
      logger.error('Failed to create content:', error)
      res.status(500).json({ error: 'Failed to create content' })
    }
  }
)

// Update content (PUT)
router.put(
  '/content/:schema/:id',
  validateSchema,
  validateContentId,
  validateContentData,
  async (req: Request, res: Response) => {
    try {
      const client = getClientFromRequest(req)
      const { schema, id } = req.params
      const data = req.body
      const options: UpdateContentOptions = {
        patch: req.query.patch === 'true',
        expectedVersion: req.query.expectedVersion
          ? parseInt(req.query.expectedVersion as string, 10)
          : undefined,
      }

      logger.info(`Updating content ${id} in schema: ${schema} (app: ${getAppName(req)})`)
      const content = await client.updateContent(schema, id, data, options)

      res.status(200).json(content)
    } catch (error) {
      logger.error('Failed to update content:', error)
      res.status(500).json({ error: 'Failed to update content' })
    }
  }
)

// Patch content
router.patch(
  '/content/:schema/:id',
  validateSchema,
  validateContentId,
  validateContentData,
  async (req: Request, res: Response) => {
    try {
      const client = getClientFromRequest(req)
      const { schema, id } = req.params
      const data = req.body
      const options: UpdateContentOptions = {
        patch: true,
        expectedVersion: req.query.expectedVersion
          ? parseInt(req.query.expectedVersion as string, 10)
          : undefined,
      }

      logger.info(`Patching content ${id} in schema: ${schema} (app: ${getAppName(req)})`)
      const content = await client.updateContent(schema, id, data, options)

      res.status(200).json(content)
    } catch (error) {
      logger.error('Failed to patch content:', error)
      res.status(500).json({ error: 'Failed to patch content' })
    }
  }
)

// Delete content
router.delete(
  '/content/:schema/:id',
  validateSchema,
  validateContentId,
  async (req: Request, res: Response) => {
    try {
      const client = getClientFromRequest(req)
      const { schema, id } = req.params
      const options: DeleteContentOptions = {
        permanent: req.query.permanent === 'true',
      }

      logger.info(`Deleting content ${id} from schema: ${schema} (app: ${getAppName(req)})`)
      await client.deleteContent(schema, id, options)

      res.status(204).send()
    } catch (error) {
      logger.error('Failed to delete content:', error)
      res.status(500).json({ error: 'Failed to delete content' })
    }
  }
)

// Publish content
router.put(
  '/content/:schema/:id/publish',
  validateSchema,
  validateContentId,
  async (req: Request, res: Response) => {
    try {
      const client = getClientFromRequest(req)
      const { schema, id } = req.params

      logger.info(`Publishing content ${id} in schema: ${schema} (app: ${getAppName(req)})`)
      const content = await client.publishContent(schema, id)

      res.status(200).json(content)
    } catch (error) {
      logger.error('Failed to publish content:', error)
      res.status(500).json({ error: 'Failed to publish content' })
    }
  }
)

// Unpublish content
router.put(
  '/content/:schema/:id/unpublish',
  validateSchema,
  validateContentId,
  async (req: Request, res: Response) => {
    try {
      const client = getClientFromRequest(req)
      const { schema, id } = req.params

      logger.info(`Unpublishing content ${id} in schema: ${schema} (app: ${getAppName(req)})`)
      const content = await client.unpublishContent(schema, id)

      res.status(200).json(content)
    } catch (error) {
      logger.error('Failed to unpublish content:', error)
      res.status(500).json({ error: 'Failed to unpublish content' })
    }
  }
)

// Archive content
router.put(
  '/content/:schema/:id/archive',
  validateSchema,
  validateContentId,
  async (req: Request, res: Response) => {
    try {
      const client = getClientFromRequest(req)
      const { schema, id } = req.params

      logger.info(`Archiving content ${id} in schema: ${schema} (app: ${getAppName(req)})`)
      const content = await client.archiveContent(schema, id)

      res.status(200).json(content)
    } catch (error) {
      logger.error('Failed to archive content:', error)
      res.status(500).json({ error: 'Failed to archive content' })
    }
  }
)

// Restore content
router.put(
  '/content/:schema/:id/restore',
  validateSchema,
  validateContentId,
  async (req: Request, res: Response) => {
    try {
      const client = getClientFromRequest(req)
      const { schema, id } = req.params

      logger.info(`Restoring content ${id} in schema: ${schema} (app: ${getAppName(req)})`)
      const content = await client.restoreContent(schema, id)

      res.status(200).json(content)
    } catch (error) {
      logger.error('Failed to restore content:', error)
      res.status(500).json({ error: 'Failed to restore content' })
    }
  }
)

export { router as squidexRouter }
