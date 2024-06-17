import request from 'supertest'
import { server } from '../../app'

describe('status should return 200', () => {
  test('should return 200', async () => {
    const response = await request(server).get('/status')
    expect(response.status).toBe(200)
  })
})

export {}
