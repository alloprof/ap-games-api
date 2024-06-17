const originalEnv = process.env
describe('config', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      API_NAME: undefined,
      LOG_LEVEL: undefined,
      BUNYAN_LOGGING: undefined,
      BASE_PATH: undefined,
      PORT: undefined,
    }
  })
  it ('should have default values', () => {
    const { config } = require('../config')

    expect(config.apiName).toEqual('ap-api')
    expect(config.logLevel).toEqual('info')
    expect(config.bunyanLogging).toEqual(false)
    expect(config.basePath).toEqual('/')
    expect(config.port).toEqual(3000)
  })
  it('should feed from environment variables', () => {
    process.env.API_NAME = 'test-api'
    process.env.LOG_LEVEL = 'debug'
    process.env.BUNYAN_LOGGING = 'false'
    process.env.BASE_PATH = '/test'
    process.env.PORT = '3001'

    const { config } = require('../config')

    expect(config.apiName).toEqual('test-api')
    expect(config.logLevel).toEqual('debug')
    expect(config.bunyanLogging).toEqual(false)
    expect(config.basePath).toEqual('/test')
    expect(config.port).toEqual(3001)
  })
  afterEach(() => {
    process.env = originalEnv
  })
  afterAll(() => {
    process.env = originalEnv
  })
})

export {}
