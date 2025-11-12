import { SquidexClient } from '../client'
import { SquidexConfig } from '../types'

describe('SquidexClient', () => {
  const mockConfig: SquidexConfig = {
    appName: 'test-app',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    url: 'https://cloud.squidex.io',
  }

  let client: SquidexClient

  beforeEach(() => {
    client = new SquidexClient(mockConfig)
  })

  describe('constructor', () => {
    it('should create a new SquidexClient instance', () => {
      expect(client).toBeInstanceOf(SquidexClient)
    })
  })

  describe('authenticate', () => {
    it('should have an authenticate method', () => {
      expect(client.authenticate).toBeDefined()
    })
  })

  describe('getContent', () => {
    it('should have a getContent method', () => {
      expect(client.getContent).toBeDefined()
    })
  })

  describe('getContentById', () => {
    it('should have a getContentById method', () => {
      expect(client.getContentById).toBeDefined()
    })
  })
})
