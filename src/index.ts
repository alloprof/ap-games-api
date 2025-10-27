import { server } from './app'
import { config } from './core/config/config'
import { logger } from './core/logger/logger'

function startServer() {
  server.listen(config.port, () => {
    logger.info(
      `🚀 ${config.apiName} is running on http://localhost:${config.port}${config.basePath}`
    )
    logger.info('CTRL+C to stop')
  })
}

startServer()
