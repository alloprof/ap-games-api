import { randomBytes } from 'crypto'

import express from 'express'
import { FieldValue } from 'firebase-admin/firestore'

import { logger } from '../core/logger/logger'
import { getFirestore, getUserFromToken } from '../games/services'

import type {
  AddGeneratorRequest,
  AddGeneratorResponse,
  AddScoreRequest,
  AddScoreResponse,
  DeleteGeneratorRequest,
  DeleteGeneratorResponse,
  GeneratorData,
  GetActiveVerbsResponse,
  GetAllGeneratorsResponse,
  GetCurrentScoresResponse,
  GetGeneratorResponse,
  GetLastMonthWinnerResponse,
  SchoolScores,
  SquidexWebhookResponse,
} from './types'
import type { Request, Response } from 'express'

const router = express.Router()

const APP_ID = 'verbivore'
const GENERATORS_LOCATION_ID = 'data/generators'
const VERBS_LOCATION_ID = 'data/verbs'
const WOWCHEF_LOCATION_ID = 'data/wowchef'
const AUTHOR_ID_KEY: keyof GeneratorData = 'Author'
const TIMESTAMP_ID_KEY: keyof GeneratorData = 'Timestamp'
const IS_OFFLINE_KEY: keyof GeneratorData = 'IsOffline'
const TAG_ID_KEY: keyof GeneratorData = 'Tag'
const GENERATOR_ID_KEY: keyof GeneratorData = 'ID'
const WOWCHEF_TIMEZONE = 'America/Toronto'
const SCHOOL_IDS = [1, 2, 3, 4] as const

// ----------------------------------------------------------------------------
function generateGeneratorID(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz123456789'
  let id = ''
  while (id.length < 5) {
    const byte = randomBytes(1)[0]
    id += chars[byte % chars.length]
  }
  return id
}

// ----------------------------------------------------------------------------
function extractErrorMessage(error: Error): string {
  return error.message.startsWith('ERR:') ? error.message.replace('ERR:', '') : error.message
}

// ----------------------------------------------------------------------------
function parseSchemaName(schemaId: unknown): string | undefined {
  if (!schemaId) return undefined
  if (typeof schemaId === 'string') return schemaId.split(',')[1]
  return (schemaId as { name: string }).name
}

// ----------------------------------------------------------------------------
function currentPeriodKey(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: WOWCHEF_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  })
  const parts = fmt.formatToParts(new Date())
  const y = parts.find((p) => p.type === 'year')?.value || '0000'
  const m = parts.find((p) => p.type === 'month')?.value || '01'
  return `${y}-${m}`
}

// ----------------------------------------------------------------------------
function lastMonthPeriodKey(): string {
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const mm = String(lastMonth.getMonth() + 1).padStart(2, '0')
  return `${lastMonth.getFullYear()}-${mm}`
}

// ----------------------------------------------------------------------------
function buildScoresObject(document: Record<string, unknown> | null): SchoolScores {
  return SCHOOL_IDS.reduce((scores, schoolId) => {
    scores[`school${schoolId}` as keyof SchoolScores] =
      (document?.[`school${schoolId}`] as number) || 0
    return scores
  }, {} as SchoolScores)
}

// ----------------------------------------------------------------------------
function daysUntilEndOfMonth(): number {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const lastDayOfMonth = new Date(nextMonth.getTime() - 1)
  return Math.ceil((lastDayOfMonth.getTime() - now.getTime()) / (1000 * 3600 * 24))
}

// ----------------------------------------------------------------------------
function buildGeneratorPath(generatorID: string): string {
  return `${APP_ID}/${GENERATORS_LOCATION_ID}/${generatorID}`
}

// ----------------------------------------------------------------------------
function buildWowChefPath(periodKey: string): string {
  return `${APP_ID}/${WOWCHEF_LOCATION_ID}/${periodKey}`
}

// ----------------------------------------------------------------------------
async function getUserFromAuthHeader(req: Request): Promise<{ uid: string } | null> {
  const authHeader = req.header('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return null
  return getUserFromToken(token)
}

// ----------------------------------------------------------------------------
function sendErrorResponse(res: Response, error: Error, statusCode = 500): void {
  res.status(statusCode).json({ success: false, message: extractErrorMessage(error) })
}

// ----------------------------------------------------------------------------
// GET /verbivore/generator/verbs/getGenerator/:generatorID
router.get(
  '/generator/verbs/getGenerator/:generatorID',
  async (req: Request<{ generatorID: string }>, res: Response<GetGeneratorResponse>) => {
    try {
      const generatorID = req.params.generatorID?.toLowerCase()
      if (!generatorID) throw new Error('ERR:Missing generatorID')

      const db = getFirestore()
      const doc = await db.doc(buildGeneratorPath(generatorID)).get()
      const generatorDocument = doc.exists ? (doc.data() as GeneratorData) : null

      res.json({
        success: !!generatorDocument,
        ...(generatorDocument
          ? {
              generatorID,
              authorID: generatorDocument[AUTHOR_ID_KEY] as string,
              data: generatorDocument,
            }
          : { message: 'ERR:Generator not found' }),
      })
    } catch (e) {
      res.json({
        success: false,
        generatorID: req.params.generatorID,
        message: extractErrorMessage(e as Error),
      })
    }
  }
)

// ----------------------------------------------------------------------------
// GET /verbivore/generator/verbs/getAllGenerators/:authorID/:tag
router.get(
  '/generator/verbs/getAllGenerators/:authorID/:tag',
  async (
    req: Request<{ authorID: string; tag: string }>,
    res: Response<GetAllGeneratorsResponse>
  ) => {
    try {
      const authorID = req.params.authorID?.toLowerCase()
      const tag = req.params.tag?.toLowerCase()

      if (!authorID) return sendErrorResponse(res, new Error('ERR:authorID not provided'), 400)
      if (authorID !== 'alloprof')
        return sendErrorResponse(
          res,
          new Error('ERR:authorID not recognized, should be alloprof'),
          400
        )
      if (!tag) return sendErrorResponse(res, new Error('ERR:Tag not provided'), 400)

      const db = getFirestore()
      const snapshot = await db
        .collection(`${APP_ID}/${GENERATORS_LOCATION_ID}`)
        .where(TAG_ID_KEY, 'array-contains', tag)
        .where(AUTHOR_ID_KEY, '==', authorID)
        .get()

      res.json({ success: true, generatorIDs: snapshot.docs.map((doc) => doc.id) })
    } catch (e) {
      sendErrorResponse(res, e as Error)
    }
  }
)

// ----------------------------------------------------------------------------
// POST /verbivore/generator/verbs/addGenerator
router.post(
  '/generator/verbs/addGenerator',
  async (
    req: Request<Record<string, string>, AddGeneratorResponse, AddGeneratorRequest>,
    res: Response<AddGeneratorResponse>
  ) => {
    try {
      const user = await getUserFromAuthHeader(req)
      if (!user) throw new Error('ERR:Could not conclude authorization header')

      const { data, generatorID: existingGeneratorID } = req.body
      if (!data) throw new Error('ERR:Missing data')

      const db = getFirestore()
      const dataSet: GeneratorData = { ...data } as GeneratorData

      if (!existingGeneratorID) {
        let generatorID: string
        do {
          generatorID = generateGeneratorID()
        } while ((await db.doc(buildGeneratorPath(generatorID)).get()).exists)

        Object.assign(dataSet, {
          [GENERATOR_ID_KEY]: generatorID,
          [AUTHOR_ID_KEY]: user.uid,
          [TIMESTAMP_ID_KEY]: Date.now(),
          [IS_OFFLINE_KEY]: false,
        })

        await db.doc(buildGeneratorPath(generatorID)).set(dataSet)

        res.json({ success: true, generatorID, data: dataSet })
      } else {
        const generatorID = existingGeneratorID.toLowerCase()
        const doc = await db.doc(buildGeneratorPath(generatorID)).get()
        const generatorDocument = doc.exists ? (doc.data() as GeneratorData) : null

        if (!generatorDocument)
          throw new Error(
            'ERR:Generator not found... This should never happen. Maybe you lost connection...'
          )
        if (generatorDocument[AUTHOR_ID_KEY] !== user.uid)
          throw new Error('ERR:Unauthorized modification since the user is not the author.')

        dataSet[TIMESTAMP_ID_KEY] = Date.now()
        await db.doc(buildGeneratorPath(generatorID)).set(dataSet, { merge: true })

        res.json({ success: true, generatorID, data: dataSet })
      }
    } catch (e) {
      sendErrorResponse(res, e as Error)
    }
  }
)

// ----------------------------------------------------------------------------
// DELETE /verbivore/generator/verbs/deleteGenerator
router.delete(
  '/generator/verbs/deleteGenerator',
  async (
    req: Request<Record<string, string>, DeleteGeneratorResponse, DeleteGeneratorRequest>,
    res: Response<DeleteGeneratorResponse>
  ) => {
    try {
      const generatorID = req.body.generatorID?.toLowerCase()
      if (!generatorID) throw new Error('ERR:Missing generatorID')

      const db = getFirestore()
      const doc = await db.doc(buildGeneratorPath(generatorID)).get()
      const generatorDocument = doc.exists ? (doc.data() as GeneratorData) : null
      if (!generatorDocument) throw new Error('ERR:Generator not found')

      const authHeader = req.header('Authorization') || ''
      if (authHeader.length === 0) {
        return res.json({ success: true, generatorID, data: generatorDocument })
      }

      const user = await getUserFromAuthHeader(req)
      if (user && generatorDocument[AUTHOR_ID_KEY] === user.uid) {
        await db.doc(buildGeneratorPath(generatorID)).delete()
      }

      res.json({ success: true, generatorID, data: generatorDocument })
    } catch (e) {
      sendErrorResponse(res, e as Error)
    }
  }
)

// ----------------------------------------------------------------------------
// POST /verbivore/generator/verbs/updateVerbFromSquidex
router.post(
  '/generator/verbs/updateVerbFromSquidex',
  express.raw({ type: '*/*' }),
  async (req: Request, res: Response<SquidexWebhookResponse>) => {
    try {
      const bodyStr = Buffer.isBuffer(req.body)
        ? req.body.toString('utf8')
        : typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body ?? {})
      const event = JSON.parse(bodyStr)
      const e = event?.payload ?? event

      const schemaName = parseSchemaName(e?.schemaId)
      if (schemaName !== 'verbes') {
        return res.status(200).json({ ok: true, skipped: 'not verbes' })
      }

      const squidexId: string = e.id
      const docPath = `${APP_ID}/${VERBS_LOCATION_ID}/${squidexId}`
      const db = getFirestore()

      if (e.type === 'Deleted') {
        await db.doc(docPath).delete()
        return res.status(200).json({ ok: true, action: 'deleted', id: squidexId })
      }

      const idVerbe: string | undefined = e.data?.['id-verbe']?.iv
      const actif: boolean = Boolean(e.data?.actif?.iv)

      if (!squidexId || !idVerbe) {
        return res.status(400).json({ ok: false, error: 'Missing id or id-verbe' })
      }

      await db.doc(docPath).set({ id: squidexId, 'id-verbe': idVerbe, actif }, { merge: true })

      return res.status(200).json({ ok: true, action: 'upsert', id: squidexId, actif })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown'
      logger.error('[updateVerbFromSquidex] error:', err)
      res.status(500).json({ ok: false, error: message })
    }
  }
)

// ----------------------------------------------------------------------------
// GET /verbivore/generator/verbs/verbs/active
router.get(
  '/generator/verbs/verbs/active',
  async (_req: Request, res: Response<GetActiveVerbsResponse>) => {
    try {
      const db = getFirestore()
      const snap = await db
        .collection(`${APP_ID}/${VERBS_LOCATION_ID}`)
        .where('actif', '==', true)
        .select('id-verbe')
        .get()

      const items = snap.docs
        .map((d) => {
          const x = d.data() as Record<string, unknown>
          return { id: d.id, 'id-verbe': String(x['id-verbe'] ?? '') }
        })
        .filter((it) => it['id-verbe'])
        .sort((a, b) => a['id-verbe'].localeCompare(b['id-verbe']))

      res.json({ success: true, total: items.length, items })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'unknown'
      res.status(500).json({ success: false, message })
    }
  }
)

// ----------------------------------------------------------------------------
// POST /verbivore/generator/verbs/wowchef/addScore
router.post(
  '/generator/verbs/wowchef/addScore',
  async (
    req: Request<Record<string, string>, AddScoreResponse, AddScoreRequest>,
    res: Response<AddScoreResponse>
  ) => {
    try {
      const { schoolId, correctConjugations } = req.body

      const validationErrors = [
        !Number.isInteger(schoolId) || !SCHOOL_IDS.includes(schoolId as (typeof SCHOOL_IDS)[number])
          ? 'Invalid schoolId. Must be 1, 2, 3, or 4'
          : null,
        !Number.isInteger(correctConjugations) || correctConjugations < 0
          ? 'correctConjugations must be a non-negative integer'
          : null,
        correctConjugations > 25 ? 'correctConjugations exceeds maximum allowed value' : null,
      ].filter(Boolean)

      if (validationErrors.length > 0) {
        return sendErrorResponse(res, new Error(`ERR:${validationErrors[0]}`), 400)
      }

      const periodKey = currentPeriodKey()
      const db = getFirestore()

      await db.doc(buildWowChefPath(periodKey)).set(
        {
          [`school${schoolId}`]: FieldValue.increment(correctConjugations),
          lastUpdated: FieldValue.serverTimestamp(),
          period: periodKey,
        },
        { merge: true }
      )

      res.json({ success: true, schoolId, correctConjugations })
    } catch (e) {
      sendErrorResponse(res, e as Error)
    }
  }
)

// ----------------------------------------------------------------------------
// GET /verbivore/generator/verbs/wowchef/getCurrentScores
router.get(
  '/generator/verbs/wowchef/getCurrentScores',
  async (_req: Request, res: Response<GetCurrentScoresResponse>) => {
    try {
      const periodKey = currentPeriodKey()
      const db = getFirestore()
      const doc = await db.doc(buildWowChefPath(periodKey)).get()
      const document = doc.exists ? (doc.data() as Record<string, unknown>) : null

      res.json({
        success: true,
        period: periodKey,
        scores: buildScoresObject(document),
        daysRemainingInMonth: daysUntilEndOfMonth(),
      })
    } catch (e) {
      sendErrorResponse(res, e as Error)
    }
  }
)

// ----------------------------------------------------------------------------
// GET /verbivore/generator/verbs/wowchef/getLastMonthWinner
router.get(
  '/generator/verbs/wowchef/getLastMonthWinner',
  async (_req: Request, res: Response<GetLastMonthWinnerResponse>) => {
    try {
      const lastMonthPeriod = lastMonthPeriodKey()
      const db = getFirestore()
      const doc = await db.doc(buildWowChefPath(lastMonthPeriod)).get()
      const document = doc.exists ? (doc.data() as Record<string, unknown>) : null

      if (!document) {
        return res.json({
          success: false,
          message: `No data found for period ${lastMonthPeriod}`,
          period: lastMonthPeriod,
        })
      }

      const schoolScores = SCHOOL_IDS.map((schoolId) => ({
        schoolId,
        score: (document[`school${schoolId}`] as number) || 0,
      }))

      const maxScore = Math.max(...schoolScores.map((s) => s.score))
      const winnersWithMaxScore = schoolScores.filter((s) => s.score === maxScore)

      let winner: { schoolId: number; score: number }

      if (winnersWithMaxScore.length > 1) {
        const selectedWinner =
          winnersWithMaxScore[Math.floor(Math.random() * winnersWithMaxScore.length)]
        await db
          .doc(buildWowChefPath(lastMonthPeriod))
          .update({ [`school${selectedWinner.schoolId}`]: FieldValue.increment(1) })
        winner = { schoolId: selectedWinner.schoolId, score: selectedWinner.score + 1 }
      } else if (winnersWithMaxScore.length === 1) {
        winner = winnersWithMaxScore[0]
      } else {
        return res.json({
          success: false,
          message: `No winner found for period ${lastMonthPeriod}`,
          period: lastMonthPeriod,
          scores: buildScoresObject(document),
        })
      }

      const updatedDoc = await db.doc(buildWowChefPath(lastMonthPeriod)).get()
      const updatedDocument = updatedDoc.exists
        ? (updatedDoc.data() as Record<string, unknown>)
        : null

      res.json({
        success: true,
        period: lastMonthPeriod,
        winnerSchoolId: winner.schoolId,
        winnerScore: winner.score,
        scores: buildScoresObject(updatedDocument || document),
      })
    } catch (e) {
      sendErrorResponse(res, e as Error)
    }
  }
)

export { router as verbivoreRouter }
