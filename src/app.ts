import express from 'express'
import { loggerRouter } from './logger/logger'
import { statusRouter } from './status/status'
import { config } from './config'

const app = express()

app.use(loggerRouter)
app.use('/status', statusRouter)

const server = express()
const basePath = config.basePath
server.use(basePath, app)

export { server }


