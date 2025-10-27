import express from 'express'

import { authRouter } from './auth'
import { config } from './core/config/config'
import { initializeFirebase } from './core/firebase'
import { loggerRouter } from './core/logger/logger'
import { squidexRouter } from './squidex'
import { statusRouter } from './status/status'

// Initialize Firebase Admin
initializeFirebase()

const app = express()

app.use(express.json())
app.use(loggerRouter)
app.use('/status', statusRouter)
app.use('/auth', authRouter)
app.use('/squidex', squidexRouter)

const server = express()
const basePath = config.basePath
server.use(basePath, app)

export { server }
