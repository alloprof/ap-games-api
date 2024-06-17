import bunyan from 'bunyan'
import { LoggingBunyan } from '@google-cloud/logging-bunyan'
import { config } from '../config'
import express from 'express'

const apiName = config.apiName
const logLevel = config.logLevel

const loggingBunyan = new LoggingBunyan({
 logName: apiName,
   redirectToStdout: true,
})

const logger = bunyan.createLogger({
  name: apiName,
  streams: [],
})

if (config.bunyanLogging) {
  logger.addStream(loggingBunyan.stream(logLevel))
} else {
  logger.addStream({ stream: process.stdout, level: logLevel })
}

const router = express.Router()

//if (config.enableRequestLogging) {
  router.use((req, _res, next) => {
    logger.info({
      method: req.method,
      url: req.url
    })
    next()
  })
//}

export { logger, router as loggerRouter }
