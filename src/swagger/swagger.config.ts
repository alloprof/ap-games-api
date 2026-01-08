import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Alloprof Games API',
      version: '0.0.1',
      description:
        'API for managing Squidex CMS content for Alloprof Games. This API acts as a proxy between client applications and Squidex CMS, handling authentication and providing a simplified interface.',
      contact: {
        name: 'Alloprof',
        url: 'https://www.alloprof.qc.ca',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:8200',
        description: 'Local development server',
      },
      {
        url: 'https://api-games-gustave.alloprof.ca',
        description: 'Staging server',
      },
      {
        url: 'https://api-games-staging.alloprof.ca',
        description: 'Gustave server',
      },
      {
        url: 'https://api-games.alloprof.ca',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Status',
        description: 'API health and status endpoints',
      },
      {
        name: 'Squidex',
        description: 'Squidex CMS content management endpoints',
      },
      {
        name: 'Auth',
        description: 'Authentication and authorization endpoints',
      },
      {
        name: 'Games',
        description: 'Firebase Authentication and Firestore operations for games',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your Firebase ID token obtained from /login endpoint',
        },
      },
      schemas: {
        SquidexContent: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique content identifier',
              example: '01234567-89ab-cdef-0123-456789abcdef',
            },
            created: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            createdBy: {
              type: 'string',
              description: 'User who created the content',
            },
            lastModified: {
              type: 'string',
              format: 'date-time',
              description: 'Last modification timestamp',
            },
            lastModifiedBy: {
              type: 'string',
              description: 'User who last modified the content',
            },
            data: {
              type: 'object',
              description: 'Content data fields',
              additionalProperties: true,
            },
            version: {
              type: 'integer',
              description: 'Content version number',
            },
          },
        },
        SquidexContentList: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of items',
              example: 100,
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/SquidexContent',
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type',
              example: 'Bad Request',
            },
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Schema name is required',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
              additionalProperties: true,
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
              example: 400,
            },
          },
        },
      },
      parameters: {
        schema: {
          name: 'schema',
          in: 'path',
          required: true,
          description: 'Squidex schema name (e.g., exercises, lessons)',
          schema: {
            type: 'string',
          },
        },
        id: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Content ID',
          schema: {
            type: 'string',
          },
        },
        app: {
          name: 'app',
          in: 'query',
          required: false,
          description:
            'Squidex app name to use. If not specified, uses the default app configured in the API',
          schema: {
            type: 'string',
          },
          examples: {
            exercisers: {
              value: 'exerciseurs',
              summary: 'Exercisers app',
            },
            pronom: {
              value: 'ap-pronom-ei',
              summary: 'Pronom app',
            },
          },
        },
        publish: {
          name: 'publish',
          in: 'query',
          required: false,
          description: 'Publish content immediately after creation',
          schema: {
            type: 'boolean',
            default: false,
          },
        },
        permanent: {
          name: 'permanent',
          in: 'query',
          required: false,
          description: 'Permanently delete content (cannot be restored)',
          schema: {
            type: 'boolean',
            default: false,
          },
        },
        expectedVersion: {
          name: 'expectedVersion',
          in: 'query',
          required: false,
          description: 'Expected content version for optimistic concurrency control',
          schema: {
            type: 'integer',
          },
        },
        top: {
          name: '$top',
          in: 'query',
          required: false,
          description: 'Number of items to return (pagination)',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 200,
            default: 20,
          },
        },
        skip: {
          name: '$skip',
          in: 'query',
          required: false,
          description: 'Number of items to skip (pagination)',
          schema: {
            type: 'integer',
            minimum: 0,
            default: 0,
          },
        },
        filter: {
          name: '$filter',
          in: 'query',
          required: false,
          description: 'OData filter expression (e.g., "data/difficulty/iv eq \'easy\'")',
          schema: {
            type: 'string',
          },
        },
        orderby: {
          name: '$orderby',
          in: 'query',
          required: false,
          description: 'OData order by expression (e.g., "created desc")',
          schema: {
            type: 'string',
          },
        },
      },
    },
  },
  apis: ['./src/**/*.ts'], // Path to the API routes
}

export const swaggerSpec = swaggerJsdoc(options)
