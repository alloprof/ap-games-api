import { SquidexClient } from '../client'
import { SquidexConfig } from '../types'

describe('SquidexClient', () => {
  const mockConfig: SquidexConfig = {
    appName: 'test-app',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    baseUrl: 'https://cloud.squidex.io',
    graphqlUrl: 'https://cloud.squidex.io/api/content/{{app}}/graphql',
    identUrl: 'https://cloud.squidex.io/identity-server/connect/token',
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

  describe('getContent', () => {
    it('should throw not implemented error', async () => {
      await expect(client.getContent('test-schema')).rejects.toThrow('Not implemented')
    })
  })

  describe('getContentById', () => {
    it('should throw not implemented error', async () => {
      await expect(client.getContentById('test-schema', '123')).rejects.toThrow('Not implemented')
    })
  })
})
