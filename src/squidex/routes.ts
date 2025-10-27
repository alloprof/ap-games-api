import express from 'express'

import { squidexConfig, getGraphUrl } from './config'

const router = express.Router()

// Get configuration info (for debugging/testing)
router.get('/config', (_req, res) => {
  res.status(200).json({
    graphqlUrl: squidexConfig.SQUIDEX_GRAPHQL_URL,
    identUrl: squidexConfig.SQUIDEX_IDENT_URL,
    app: squidexConfig.SQUIDEX_EXERCISERS_APP,
    exercisersGraphUrl: getGraphUrl(),
  })
})

// Example: Get content from Squidex
router.get('/content/:schema', async (req, res) => {
  try {
    // TODO: Initialize SquidexClient with config
    // const client = new SquidexClient(config)
    // const content = await client.getContent(req.params.schema)
    res.status(200).json({
      message: 'Squidex content endpoint',
      schema: req.params.schema,
      graphUrl: getGraphUrl(),
    })
  } catch {
    res.status(500).json({ error: 'Failed to fetch content' })
  }
})

// Example: Get single content item
router.get('/content/:schema/:id', async (req, res) => {
  try {
    res.status(200).json({
      message: 'Squidex single content endpoint',
      schema: req.params.schema,
      id: req.params.id,
    })
  } catch {
    res.status(500).json({ error: 'Failed to fetch content' })
  }
})

export { router as squidexRouter }
