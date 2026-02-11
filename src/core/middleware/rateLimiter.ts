import rateLimit from 'express-rate-limit'

import type { Request } from 'express'

interface LoginRequestBody {
  email: string
  password: string
}

/**
 * Rate limiter for login endpoint only
 * Prevents brute force attacks
 * Uses email as the key - each user has their own limit
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each email to 10 requests per windowMs
  keyGenerator: (req: Request<object, unknown, LoginRequestBody>): string => {
    const { email } = req.body
    return email.toLowerCase().trim()
  },
  skip: (req: Request<object, unknown, LoginRequestBody>): boolean => {
    // Skip rate limiting if email is missing (will be handled by validation)
    return !req.body?.email || typeof req.body.email !== 'string'
  },
  message: {
    success: false,
    code: 'too-many-requests',
    name: 'RateLimitError',
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * Rate limiter for general API endpoints
 * More permissive than auth limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    code: 'too-many-requests',
    name: 'RateLimitError',
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
})
