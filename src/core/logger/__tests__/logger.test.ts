import request from 'supertest'

const originalEnv = process.env

describe('logger', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      API_NAME: undefined,
      LOG_LEVEL: undefined,
      BUNYAN_LOGGING: 'false',
      ENABLE_REQUEST_LOGGING: 'true',
      BASE_PATH: undefined,
      PORT: undefined,
    }
  })
  it('should call bunyan logging and output locally', () => {
    const config = require('../../config/config').config
    config.bunyanLogging = false

    const logger = require('../logger').logger
    const spyLogWarn = jest.spyOn(require('bunyan').prototype, 'warn')
    logger.warn('test')
    expect(spyLogWarn).toHaveBeenCalledWith('test')
  })
  it('should call bunyan logging with stream to Google Cloud enabled', () => {
    const config = require('../../config/config').config
    config.bunyanLogging = true

    const logger = require('../logger').logger
    const spyLogWarn = jest.spyOn(require('bunyan').prototype, 'warn')
    logger.warn('test')
    expect(spyLogWarn).toHaveBeenCalledWith('test')
  })
  test('should log all requests', async () => {
    const spyLogInfo = jest.spyOn(require('bunyan').prototype, 'info')
    const server = require('../../../app').server
    await request(server).get('/status')

    expect(spyLogInfo).toHaveBeenCalledWith({ method: 'GET', url: '/status' })
  })
  afterEach(() => {
    process.env = originalEnv
  })
  afterAll(() => {
    process.env = originalEnv
  })
})

export {}
