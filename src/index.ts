import { logger } from './logger/logger'
import { config } from './config'
import { server } from './app'

function startServer() {
  server.listen(config.port, () => {
    logger.info(`🚀 ${config.apiName} is running on http://localhost:${config.port}${config.basePath}`)
    logger.info('CTRL+C to stop')
  })
}

startServer()
