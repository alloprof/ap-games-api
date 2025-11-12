import express from 'express'
import swaggerUi from 'swagger-ui-express'

import { swaggerSpec } from './swagger.config'

const router = express.Router()

// Swagger JSON endpoint
router.get('/swagger.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// Swagger UI
router.use('/', swaggerUi.serve)
router.get(
  '/',
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Alloprof Games API Documentation',
  })
)

export { router as swaggerRouter }
