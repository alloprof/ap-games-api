import axios, { AxiosInstance } from 'axios'

import { logger } from '../core/logger/logger'

import { SquidexConfig, SquidexAuthToken, SquidexContent, SquidexQuery } from './types'

export interface SquidexContentList<T = SquidexContent> {
  total: number
  items: T[]
}

export interface CreateContentOptions {
  publish?: boolean
  id?: string
}

export interface UpdateContentOptions {
  patch?: boolean
  expectedVersion?: number
}

export interface DeleteContentOptions {
  permanent?: boolean
}

export class SquidexClient {
  private config: SquidexConfig
  private token: SquidexAuthToken | null = null
  private tokenExpiresAt: number = 0
  private axiosInstance: AxiosInstance

  constructor(config: SquidexConfig) {
    this.config = config
    this.axiosInstance = axios.create({
      timeout: 30000,
    })
  }

  /**
   * Authenticate with Squidex and get access token
   */
  async authenticate(): Promise<void> {
    try {
      const response = await axios.post<SquidexAuthToken>(
        `${this.config.url}/identity-server/connect/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: 'squidex-api',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      this.token = response.data
      // Set expiration with 5 minute buffer
      this.tokenExpiresAt = Date.now() + (response.data.expires_in - 300) * 1000
      logger.info('Successfully authenticated with Squidex')
    } catch (error) {
      logger.error('Failed to authenticate with Squidex:', error)
      throw new Error('Squidex authentication failed')
    }
  }

  /**
   * Get content from a Squidex schema
   */
  async getContent<T = SquidexContent>(
    schema: string,
    query?: SquidexQuery
  ): Promise<SquidexContentList<T>> {
    await this.ensureAuthenticated()

    try {
      const url = `${this.config.url}/api/content/${this.config.appName}/${schema}`
      const response = await this.axiosInstance.get<SquidexContentList<T>>(url, {
        params: query,
        headers: {
          Authorization: `Bearer ${this.token?.access_token}`,
        },
      })

      return response.data
    } catch (error) {
      logger.error(`Failed to fetch content from schema ${schema}:`, error)
      throw error
    }
  }

  /**
   * Get single content item by ID
   */
  async getContentById<T = SquidexContent>(schema: string, id: string): Promise<T> {
    await this.ensureAuthenticated()

    try {
      const url = `${this.config.url}/api/content/${this.config.appName}/${schema}/${id}`
      const response = await this.axiosInstance.get<T>(url, {
        headers: {
          Authorization: `Bearer ${this.token?.access_token}`,
        },
      })

      return response.data
    } catch (error) {
      logger.error(`Failed to fetch content ${id} from schema ${schema}:`, error)
      throw error
    }
  }

  /**
   * Create content in Squidex
   */

  async createContent<T = SquidexContent>(
    schema: string,
    data: Record<string, unknown>,
    options?: CreateContentOptions
  ): Promise<T> {
    await this.ensureAuthenticated()

    try {
      const url = `${this.config.url}/api/content/${this.config.appName}/${schema}`
      const params: Record<string, string | boolean> = {}
      if (options?.publish) params.publish = true
      if (options?.id) params.id = options.id

      const response = await this.axiosInstance.post<T>(url, data, {
        params,
        headers: {
          Authorization: `Bearer ${this.token?.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      return response.data
    } catch (error) {
      logger.error(`Failed to create content in schema ${schema}:`, error)
      throw error
    }
  }

  /**
   * Update content in Squidex
   */
  async updateContent<T = SquidexContent>(
    schema: string,
    id: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>,
    options?: UpdateContentOptions
  ): Promise<T> {
    await this.ensureAuthenticated()

    try {
      const url = `${this.config.url}/api/content/${this.config.appName}/${schema}/${id}`
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.token?.access_token}`,
        'Content-Type': 'application/json',
      }

      if (options?.expectedVersion !== undefined) {
        headers['If-Match'] = String(options.expectedVersion)
      }

      const method = options?.patch ? 'patch' : 'put'
      const response = await this.axiosInstance[method]<T>(url, data, { headers })

      return response.data
    } catch (error) {
      logger.error(`Failed to update content ${id} in schema ${schema}:`, error)
      throw error
    }
  }

  /**
   * Delete content from Squidex
   */
  async deleteContent(schema: string, id: string, options?: DeleteContentOptions): Promise<void> {
    await this.ensureAuthenticated()

    try {
      const url = `${this.config.url}/api/content/${this.config.appName}/${schema}/${id}`
      const params: Record<string, boolean> = {}
      if (options?.permanent) params.permanent = true

      await this.axiosInstance.delete(url, {
        params,
        headers: {
          Authorization: `Bearer ${this.token?.access_token}`,
        },
      })
    } catch (error) {
      logger.error(`Failed to delete content ${id} from schema ${schema}:`, error)
      throw error
    }
  }

  /**
   * Publish a content item
   */
  async publishContent<T = SquidexContent>(schema: string, id: string): Promise<T> {
    await this.ensureAuthenticated()

    try {
      const url = `${this.config.url}/api/content/${this.config.appName}/${schema}/${id}/publish`
      const response = await this.axiosInstance.put<T>(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.token?.access_token}`,
          },
        }
      )

      return response.data
    } catch (error) {
      logger.error(`Failed to publish content ${id} in schema ${schema}:`, error)
      throw error
    }
  }

  /**
   * Unpublish a content item
   */
  async unpublishContent<T = SquidexContent>(schema: string, id: string): Promise<T> {
    await this.ensureAuthenticated()

    try {
      const url = `${this.config.url}/api/content/${this.config.appName}/${schema}/${id}/unpublish`
      const response = await this.axiosInstance.put<T>(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.token?.access_token}`,
          },
        }
      )

      return response.data
    } catch (error) {
      logger.error(`Failed to unpublish content ${id} in schema ${schema}:`, error)
      throw error
    }
  }

  /**
   * Archive a content item
   */
  async archiveContent<T = SquidexContent>(schema: string, id: string): Promise<T> {
    await this.ensureAuthenticated()

    try {
      const url = `${this.config.url}/api/content/${this.config.appName}/${schema}/${id}/archive`
      const response = await this.axiosInstance.put<T>(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.token?.access_token}`,
          },
        }
      )

      return response.data
    } catch (error) {
      logger.error(`Failed to archive content ${id} in schema ${schema}:`, error)
      throw error
    }
  }

  /**
   * Restore a content item from archive
   */
  async restoreContent<T = SquidexContent>(schema: string, id: string): Promise<T> {
    await this.ensureAuthenticated()

    try {
      const url = `${this.config.url}/api/content/${this.config.appName}/${schema}/${id}/restore`
      const response = await this.axiosInstance.put<T>(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.token?.access_token}`,
          },
        }
      )

      return response.data
    } catch (error) {
      logger.error(`Failed to restore content ${id} in schema ${schema}:`, error)
      throw error
    }
  }

  /**
   * Check if token is valid
   */
  private isTokenValid(): boolean {
    return this.token !== null && Date.now() < this.tokenExpiresAt
  }

  /**
   * Ensure we have a valid token
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.isTokenValid()) {
      await this.authenticate()
    }
  }
}
