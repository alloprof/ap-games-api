import express from 'express'

import { logger } from '../core/logger/logger'
import { getFirestore } from '../games/services'

import type { ListScenariosRequest, ListScenariosResponse, ScenarioResponse } from './types'
import type { Query } from 'firebase-admin/firestore'

const router = express.Router()

/**
 * GET /exercisers/scenario/:appId/:scenarioId
 * Get a scenario by ID (public, no authentication required)
 */
router.get(
  '/scenario/:appId/:scenarioId',
  async (
    req: express.Request<{ appId: string; scenarioId: string }>,
    res: express.Response<ScenarioResponse | null>
  ) => {
    try {
      const { appId } = req.params
      let { scenarioId } = req.params

      if (!appId) {
        return res.status(400).json({
          success: false,
          message: 'No Application ID was provided in the path',
        })
      }

      if (!scenarioId) {
        return res.status(400).json({
          success: false,
          message: 'No Scenario ID was provided in the path',
        })
      }

      // Normalize 5-character scenario IDs to lowercase
      if (scenarioId.length === 5) {
        scenarioId = scenarioId.toLowerCase()
      }

      const db = getFirestore()
      const docRef = db.doc(`exercisers/${appId}/scenarios/${scenarioId}`)
      const docSnap = await docRef.get()

      if (docSnap.exists) {
        const data = docSnap.data()
        return res.json({
          success: true,
          data: data as Record<string, unknown>,
        })
      } else {
        return res.json(null)
      }
    } catch (error) {
      logger.error('Error in GET /exercisers/scenario:', error)
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
      })
    }
  }
)

/**
 * POST /exercisers/list_scenarios
 * List scenarios by tag (public, no authentication required)
 */
router.post(
  '/list_scenarios',
  async (
    req: express.Request<object, ListScenariosResponse, ListScenariosRequest>,
    res: express.Response<ListScenariosResponse>
  ) => {
    try {
      const { appId, tag, author } = req.body

      if (!appId) {
        return res.status(400).json({
          success: false,
          message: 'No Application ID was provided',
        })
      }

      if (!tag) {
        return res.status(400).json({
          success: false,
          message: 'No tag was provided',
        })
      }

      if (author && author !== 'squidex' && author !== 'alloprof') {
        return res.status(400).json({
          success: false,
          message: 'Author not recognized',
        })
      }

      const db = getFirestore()
      let query: Query = db
        .collection(`exercisers/${appId}/scenarios`)
        .where('tags', 'array-contains', tag)

      if (author) {
        query = query.where('AUTHOR_ID', '==', author)
      }

      const snapshot = await query.get()
      const list: string[] = []

      snapshot.forEach((doc) => {
        list.push(doc.id)
      })

      return res.json({
        success: true,
        list,
        count: list.length,
      })
    } catch (error) {
      logger.error('Error in POST /exercisers/list_scenarios:', error)
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred',
      })
    }
  }
)

export { router as exercisersRouter }
