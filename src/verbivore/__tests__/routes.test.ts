import request from 'supertest'

import { app } from '../../app'
import * as gamesServices from '../../games/services'

import type { DecodedIdToken } from 'firebase-admin/auth'
import type { Firestore } from 'firebase-admin/firestore'

jest.mock('../../games/services')
jest.mock('../../core/logger/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  loggerRouter: require('express').Router(),
}))

const mockGetFirestore = gamesServices.getFirestore as jest.MockedFunction<
  typeof gamesServices.getFirestore
>
const mockGetUserFromToken = gamesServices.getUserFromToken as jest.MockedFunction<
  typeof gamesServices.getUserFromToken
>

// ---------------------------------------------------------------------------
// Firestore mock helpers
// ---------------------------------------------------------------------------

function makeDocRef(data: Record<string, unknown> | null) {
  const snap = { exists: !!data, data: () => data }
  return {
    get: jest.fn().mockResolvedValue(snap),
    set: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
  }
}

function makeDb(docData: Record<string, unknown> | null = null, collectionDocs: string[] = []) {
  const docRef = makeDocRef(docData)
  const snap = { docs: collectionDocs.map((id) => ({ id, data: () => ({}) })) }
  const query = { where: jest.fn(), get: jest.fn().mockResolvedValue(snap) }
  query.where.mockReturnValue(query)
  return {
    doc: jest.fn().mockReturnValue(docRef),
    collection: jest.fn().mockReturnValue(query),
    _docRef: docRef,
  }
}

type MockDb = ReturnType<typeof makeDb>

const VALID_GENERATOR = {
  ID: 'abc12',
  Author: 'uid-user',
  Timestamp: 1000000,
  IsOffline: false,
  Tag: ['test'],
}

beforeEach(() => jest.clearAllMocks())

// ---------------------------------------------------------------------------
// GET /verbivore/generator/verbs/getGenerator/:generatorID
// ---------------------------------------------------------------------------
describe('GET /verbivore/generator/verbs/getGenerator/:generatorID', () => {
  it('returns generator when found', async () => {
    mockGetFirestore.mockReturnValue(makeDb(VALID_GENERATOR) as unknown as Firestore)

    const res = await request(app).get('/verbivore/generator/verbs/getGenerator/abc12')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.generatorID).toBe('abc12')
    expect(res.body.authorID).toBe('uid-user')
  })

  it('returns success:false when not found', async () => {
    mockGetFirestore.mockReturnValue(makeDb(null) as unknown as Firestore)

    const res = await request(app).get('/verbivore/generator/verbs/getGenerator/notfound')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(false)
  })

  it('lowercases the generatorID', async () => {
    const db = makeDb(VALID_GENERATOR)
    mockGetFirestore.mockReturnValue(db as unknown as Firestore)

    await request(app).get('/verbivore/generator/verbs/getGenerator/ABC12')

    expect(db.doc).toHaveBeenCalledWith(expect.stringContaining('abc12'))
  })
})

// ---------------------------------------------------------------------------
// GET /verbivore/generator/verbs/getAllGenerators/:authorID/:tag
// ---------------------------------------------------------------------------
describe('GET /verbivore/generator/verbs/getAllGenerators/:authorID/:tag', () => {
  it('returns generatorIDs for alloprof', async () => {
    mockGetFirestore.mockReturnValue(makeDb(null, ['id1', 'id2']) as unknown as Firestore)

    const res = await request(app).get('/verbivore/generator/verbs/getAllGenerators/alloprof/test')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.generatorIDs).toEqual(['id1', 'id2'])
  })

  it('returns 400 for unknown authorID', async () => {
    const res = await request(app).get('/verbivore/generator/verbs/getAllGenerators/unknown/test')

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// POST /verbivore/generator/verbs/addGenerator
// ---------------------------------------------------------------------------
describe('POST /verbivore/generator/verbs/addGenerator', () => {
  it('returns 500 when no auth header', async () => {
    mockGetUserFromToken.mockResolvedValue(null)

    const res = await request(app)
      .post('/verbivore/generator/verbs/addGenerator')
      .send({ data: { Tag: ['test'] } })

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
  })

  it('creates a new generator with valid auth', async () => {
    mockGetUserFromToken.mockResolvedValue({ uid: 'uid-user' } as unknown as DecodedIdToken)
    const db = makeDb(null)
    db._docRef.get.mockResolvedValue({ exists: false, data: () => null })
    mockGetFirestore.mockReturnValue(db as unknown as Firestore)

    const res = await request(app)
      .post('/verbivore/generator/verbs/addGenerator')
      .set('Authorization', 'Bearer valid-token')
      .send({ data: { Tag: ['test'] } })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.generatorID).toHaveLength(5)
    expect(res.body.data.Author).toBe('uid-user')
  })

  it('updates existing generator when generatorID provided', async () => {
    mockGetUserFromToken.mockResolvedValue({ uid: 'uid-user' } as unknown as DecodedIdToken)
    const db = makeDb(VALID_GENERATOR)
    mockGetFirestore.mockReturnValue(db as unknown as Firestore)

    const res = await request(app)
      .post('/verbivore/generator/verbs/addGenerator')
      .set('Authorization', 'Bearer valid-token')
      .send({ data: { Tag: ['updated'] }, generatorID: 'abc12' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(db._docRef.set).toHaveBeenCalledWith(expect.any(Object), { merge: true })
  })

  it('returns 500 when user tries to update another author generator', async () => {
    mockGetUserFromToken.mockResolvedValue({ uid: 'other-uid' } as unknown as DecodedIdToken)
    mockGetFirestore.mockReturnValue(makeDb(VALID_GENERATOR) as unknown as Firestore)

    const res = await request(app)
      .post('/verbivore/generator/verbs/addGenerator')
      .set('Authorization', 'Bearer valid-token')
      .send({ data: { Tag: ['test'] }, generatorID: 'abc12' })

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// DELETE /verbivore/generator/verbs/deleteGenerator
// ---------------------------------------------------------------------------
describe('DELETE /verbivore/generator/verbs/deleteGenerator', () => {
  it('returns data without deleting when no auth header', async () => {
    mockGetFirestore.mockReturnValue(makeDb(VALID_GENERATOR) as unknown as Firestore)

    const res = await request(app)
      .delete('/verbivore/generator/verbs/deleteGenerator')
      .send({ generatorID: 'abc12' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toBeDefined()
  })

  it('deletes generator when user is author', async () => {
    mockGetUserFromToken.mockResolvedValue({ uid: 'uid-user' } as unknown as DecodedIdToken)
    const db = makeDb(VALID_GENERATOR)
    mockGetFirestore.mockReturnValue(db as unknown as Firestore)

    const res = await request(app)
      .delete('/verbivore/generator/verbs/deleteGenerator')
      .set('Authorization', 'Bearer valid-token')
      .send({ generatorID: 'abc12' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(db._docRef.delete).toHaveBeenCalled()
  })

  it('returns 500 when generatorID missing', async () => {
    const res = await request(app).delete('/verbivore/generator/verbs/deleteGenerator').send({})

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// POST /verbivore/generator/verbs/updateVerbFromSquidex
// ---------------------------------------------------------------------------
describe('POST /verbivore/generator/verbs/updateVerbFromSquidex', () => {
  it('skips non-verbes schema', async () => {
    const res = await request(app)
      .post('/verbivore/generator/verbs/updateVerbFromSquidex')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ schemaId: 'app,other', type: 'Upsert', id: 'sq1', data: {} }))

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.skipped).toBe('not verbes')
  })

  it('upserts verb for verbes schema', async () => {
    const db = makeDb(null)
    mockGetFirestore.mockReturnValue(db as unknown as Firestore)

    const payload = {
      schemaId: 'app,verbes',
      type: 'Upsert',
      id: 'squid-1',
      data: { 'id-verbe': { iv: 'avoir' }, actif: { iv: true } },
    }

    const res = await request(app)
      .post('/verbivore/generator/verbs/updateVerbFromSquidex')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(payload))

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.action).toBe('upsert')
  })

  it('deletes verb when type is Deleted', async () => {
    const db = makeDb(null)
    mockGetFirestore.mockReturnValue(db as unknown as Firestore)

    const payload = { schemaId: 'app,verbes', type: 'Deleted', id: 'squid-1' }

    const res = await request(app)
      .post('/verbivore/generator/verbs/updateVerbFromSquidex')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(payload))

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.action).toBe('deleted')
    expect(db._docRef.delete).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// GET /verbivore/generator/verbs/verbs/active
// ---------------------------------------------------------------------------
describe('GET /verbivore/generator/verbs/verbs/active', () => {
  it('returns active verbs sorted alphabetically', async () => {
    const snap = {
      docs: [
        { id: 'sq2', data: () => ({ 'id-verbe': 'être' }) },
        { id: 'sq1', data: () => ({ 'id-verbe': 'avoir' }) },
      ],
    }
    const db = {
      doc: jest.fn(),
      collection: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue(snap) }),
        }),
      }),
    }
    mockGetFirestore.mockReturnValue(db as unknown as Firestore)

    const res = await request(app).get('/verbivore/generator/verbs/verbs/active')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.total).toBe(2)
    expect(res.body.items[0]['id-verbe']).toBe('avoir')
  })
})

// ---------------------------------------------------------------------------
// POST /verbivore/generator/verbs/wowchef/addScore
// ---------------------------------------------------------------------------
describe('POST /verbivore/generator/verbs/wowchef/addScore', () => {
  it('returns 400 for invalid schoolId', async () => {
    const res = await request(app)
      .post('/verbivore/generator/verbs/wowchef/addScore')
      .send({ schoolId: 5, correctConjugations: 10 })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 for negative correctConjugations', async () => {
    const res = await request(app)
      .post('/verbivore/generator/verbs/wowchef/addScore')
      .send({ schoolId: 1, correctConjugations: -1 })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 when correctConjugations exceeds 25', async () => {
    const res = await request(app)
      .post('/verbivore/generator/verbs/wowchef/addScore')
      .send({ schoolId: 1, correctConjugations: 26 })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('saves score successfully', async () => {
    const db = makeDb(null)
    mockGetFirestore.mockReturnValue(db as unknown as Firestore)

    const res = await request(app)
      .post('/verbivore/generator/verbs/wowchef/addScore')
      .send({ schoolId: 2, correctConjugations: 15 })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.schoolId).toBe(2)
    expect(res.body.correctConjugations).toBe(15)
    expect(db._docRef.set).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// GET /verbivore/generator/verbs/wowchef/getCurrentScores
// ---------------------------------------------------------------------------
describe('GET /verbivore/generator/verbs/wowchef/getCurrentScores', () => {
  it('returns current scores with defaults at 0', async () => {
    mockGetFirestore.mockReturnValue(
      makeDb({ school1: 10, school2: 5, period: '2026-03' }) as unknown as Firestore
    )

    const res = await request(app).get('/verbivore/generator/verbs/wowchef/getCurrentScores')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.scores.school1).toBe(10)
    expect(res.body.scores.school3).toBe(0)
    expect(res.body.daysRemainingInMonth).toBeGreaterThan(0)
  })

  it('returns all zeros when no document', async () => {
    mockGetFirestore.mockReturnValue(makeDb(null) as unknown as Firestore)

    const res = await request(app).get('/verbivore/generator/verbs/wowchef/getCurrentScores')

    expect(res.status).toBe(200)
    expect(res.body.scores).toEqual({ school1: 0, school2: 0, school3: 0, school4: 0 })
  })
})

// ---------------------------------------------------------------------------
// GET /verbivore/generator/verbs/wowchef/getLastMonthWinner
// ---------------------------------------------------------------------------
describe('GET /verbivore/generator/verbs/wowchef/getLastMonthWinner', () => {
  it('returns success:false when no data for last month', async () => {
    mockGetFirestore.mockReturnValue(makeDb(null) as unknown as Firestore)

    const res = await request(app).get('/verbivore/generator/verbs/wowchef/getLastMonthWinner')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(false)
  })

  it('returns winner when there is a clear winner', async () => {
    mockGetFirestore.mockReturnValue(
      makeDb({ school1: 100, school2: 50, school3: 30, school4: 20 }) as unknown as Firestore
    )

    const res = await request(app).get('/verbivore/generator/verbs/wowchef/getLastMonthWinner')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.winnerSchoolId).toBe(1)
    expect(res.body.winnerScore).toBe(100)
  })
})

// Ensure MockDb type is used (referenced via makeDb return type)
type _MockDb = MockDb
