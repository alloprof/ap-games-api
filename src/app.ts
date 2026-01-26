import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'

import { authRouter } from './auth'
import { config } from './core/config/config'
import { initializeFirebase } from './core/firebase'
import { loggerRouter } from './core/logger/logger'
import { gamesRouter } from './games'
import { squidexRouter } from './squidex'
import { statusRouter } from './status/status'
import { swaggerRouter } from './swagger'

// Initialize Firebase Admin
initializeFirebase()

const app = express()

// Configure CORS to allow requests from Angular dev server
app.use(
  cors({
    origin: ['http://localhost:4200', 'http://localhost:57170'],
    credentials: true,
  })
)

app.use(express.json())
app.use(cookieParser())
app.use(loggerRouter)
app.use('/status', statusRouter)
app.use('/auth', authRouter)
app.use(gamesRouter)
app.use('/squidex', squidexRouter)
app.use('/api-docs', swaggerRouter)

const server = express()
const basePath = config.basePath
server.use(basePath, app)

export { server, app }
