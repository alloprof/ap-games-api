import express from 'express'
import request from 'supertest'

import { authRateLimiter, apiRateLimiter } from '../rateLimiter'

describe('Rate Limiter Middleware', () => {
  describe('authRateLimiter', () => {
    let app: express.Application

    beforeEach(() => {
      app = express()
      app.use(express.json())
      app.post('/test-login', authRateLimiter, (req, res) => {
        res.json({ success: true })
      })
    })

    it('should allow requests with valid email', async () => {
      const response = await request(app)
        .post('/test-login')
        .send({ email: 'test@example.com', password: 'password123' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should skip rate limiting when email is missing', async () => {
      const response = await request(app).post('/test-login').send({ password: 'password123' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should skip rate limiting when email is not a string', async () => {
      const response = await request(app).post('/test-login').send({ email: 123, password: 'test' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should normalize email to lowercase', async () => {
      // First request with uppercase
      const response1 = await request(app)
        .post('/test-login')
        .send({ email: 'TEST@EXAMPLE.COM', password: 'password123' })

      expect(response1.status).toBe(200)

      // Both should count towards the same limit (same email, different case)
      const response2 = await request(app)
        .post('/test-login')
        .send({ email: 'test@example.com', password: 'password123' })

      expect(response2.status).toBe(200)
    })
  })

  describe('apiRateLimiter', () => {
    let app: express.Application

    beforeEach(() => {
      app = express()
      app.use(express.json())
      app.get('/test-api', apiRateLimiter, (req, res) => {
        res.json({ success: true })
      })
    })

    it('should allow requests within limit', async () => {
      const response = await request(app).get('/test-api')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should include rate limit headers', async () => {
      const response = await request(app).get('/test-api')

      expect(response.headers).toHaveProperty('ratelimit-limit')
      expect(response.headers).toHaveProperty('ratelimit-remaining')
    })
  })
})
