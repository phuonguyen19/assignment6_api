import swaggerJSDoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Todo REST API',
      version: '1.0.0',
      description: 'OpenAPI documentation for the Todo REST API (Assignments 4 & 5)'
    },
    servers: [
      {
        url: 'http://localhost:3000/doc',
        description: 'Local server'
      }
    ],
    components: {
      schemas: {
        TodoState: {
          type: 'string',
          enum: ['todo', 'doing', 'done'],
          example: 'todo'
        },
        TodoItem: {
          type: 'object',
          required: ['id', 'title', 'state', 'createdAt', 'updatedAt'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            title: {
              type: 'string',
              example: 'Write API documentation'
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'OpenAPI + README examples'
            },
            state: {
              $ref: '#/components/schemas/TodoState'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-11-25T10:00:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-11-25T10:05:00.000Z'
            }
          }
        },
        CreateTodoInput: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              example: 'Write API documentation'
            },
            description: {
              type: 'string',
              example: 'OpenAPI + README examples'
            },
            state: {
              $ref: '#/components/schemas/TodoState'
            }
          }
        },
        UpdateTodoInput: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              example: 'Write API documentation'
            },
            description: {
              type: 'string',
              example: 'OpenAPI + README examples + integration tests'
            },
            state: {
              $ref: '#/components/schemas/TodoState'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Todo not found'
            }
          }
        }
      }
    }
  },
  apis: ['./app.js', './server.js', './routes/*.js']
}

const swaggerSpec = swaggerJSDoc(options)

export default swaggerSpec