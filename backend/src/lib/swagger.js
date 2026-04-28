import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Test Sambil Ngopi Coy API',
      version: '1.0.0',
      description:
        'REST API for Test Sambil Ngopi Coy — Automated Web Testing Platform. ' +
        'Record browser interactions, execute test scenarios, and view results.',
      contact: { name: 'Test Sambil Ngopi Coy' }
    },
    servers: [
      { url: 'http://localhost:5001', description: 'Local development' },
      { url: 'http://localhost:5001', description: 'Docker' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from POST /api/auth/login'
        }
      },
      schemas: {
        Scenario: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            steps: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        TestStep: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            stepNumber: { type: 'integer' },
            type: {
              type: 'string',
              enum: ['NAVIGATE', 'CLICK', 'FILL', 'SCREENSHOT', 'WAIT', 'ASSERTION', 'API_CALL', 'HOVER', 'SCROLL', 'FILE_UPLOAD']
            },
            description: { type: 'string' },
            selector: { type: 'string' },
            value: { type: 'string' },
            metadata: { type: 'object' }
          }
        },
        Execution: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'RUNNING', 'PASSED', 'FAILED'] },
            passedSteps: { type: 'integer' },
            failedSteps: { type: 'integer' },
            totalSteps: { type: 'integer' },
            duration: { type: 'integer', description: 'Duration in ms' },
            browser: { type: 'string', enum: ['chromium', 'firefox', 'webkit'] },
            headless: { type: 'boolean' },
            videoPath: { type: 'string', description: 'URL to execution video' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Scenarios', description: 'Test scenario CRUD' },
      { name: 'Test Steps', description: 'Step management within a scenario' },
      { name: 'Execution', description: 'Run scenarios and view results' },
      { name: 'Recorder', description: 'Browser recording session management' },
      { name: 'Search', description: 'Search and filter scenarios' }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
}

export const swaggerSpec = swaggerJsdoc(options)
