import { AxiosError } from 'axios'
import { Request, Response, NextFunction } from 'express'

import { logger } from '../core/logger/logger'

/**
 * Error handler middleware for Squidex routes
 */
export function squidexErrorHandler(
  error: Error | AxiosError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log the error
  logger.error('Squidex API Error:', {
    method: req.method,
    path: req.path,
    error: error.message,
    stack: error.stack,
  })

  // Handle Axios errors (from Squidex API)
  if (isAxiosError(error)) {
    const status = error.response?.status || 500
    const data = error.response?.data as Record<string, unknown>

    return res.status(status).json({
      error: 'Squidex API Error',
      message: (data?.message as string) || error.message,
      details: data,
      statusCode: status,
    })
  }

  // Handle generic errors
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message,
  })
}

/**
 * Type guard for Axios errors
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    error.isAxiosError === true
  )
}

/**
 * Middleware to validate required parameters
 */
export function validateSchema(req: Request, res: Response, next: NextFunction) {
  const { schema } = req.params

  if (!schema || schema.trim().length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Schema name is required',
    })
  }

  next()
}

/**
 * Middleware to validate content ID
 */
export function validateContentId(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params

  if (!id || id.trim().length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Content ID is required',
    })
  }

  next()
}

/**
 * Middleware to validate request body for create/update operations
 */
export function validateContentData(req: Request, res: Response, next: NextFunction) {
  const data = req.body

  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Content data is required and must be a non-empty object',
    })
  }

  next()
}
