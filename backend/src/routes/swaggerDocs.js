/**
 * OpenAPI path definitions for platform feature routes.
 * Merged into swagger spec via swagger.js
 */

export const platformPaths = {
  '/api/api-tests/scenarios/{scenarioId}': {
    get: {
      tags: ['API Testing'],
      summary: 'List API tests for a scenario',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'scenarioId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'List of API tests' } }
    },
    post: {
      tags: ['API Testing'],
      summary: 'Create API test',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'scenarioId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 201: { description: 'API test created' } }
    }
  },
  '/api/api-tests/{apiTestId}/run': {
    post: {
      tags: ['API Testing'],
      summary: 'Run API test',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'apiTestId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Run result' } }
    }
  },
  '/api/issues': {
    get: {
      tags: ['Issues'],
      summary: 'List test issues',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'CLOSED'] } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
        { name: 'offset', in: 'query', schema: { type: 'integer' } }
      ],
      responses: { 200: { description: 'Paginated issues' } }
    }
  },
  '/api/issues/{issueId}': {
    get: {
      tags: ['Issues'],
      summary: 'Get issue by ID',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'issueId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Issue detail' } }
    },
    patch: {
      tags: ['Issues'],
      summary: 'Update issue status or severity',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'issueId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Updated issue' } }
    }
  },
  '/api/environments': {
    get: {
      tags: ['Environments'],
      summary: 'List environments',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Environment list' } }
    },
    post: {
      tags: ['Environments'],
      summary: 'Create environment',
      security: [{ bearerAuth: [] }],
      responses: { 201: { description: 'Environment created' } }
    }
  },
  '/api/environments/{environmentId}/resolved': {
    get: {
      tags: ['Environments'],
      summary: 'Get resolved variables (secrets masked in UI)',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'environmentId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Variable map' } }
    }
  },
  '/api/visual-regression/baselines': {
    get: {
      tags: ['Visual Regression'],
      summary: 'List visual baselines',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'scenarioId', in: 'query', schema: { type: 'string' } }],
      responses: { 200: { description: 'Baseline list' } }
    }
  },
  '/api/visual-regression/run/{scenarioId}': {
    post: {
      tags: ['Visual Regression'],
      summary: 'Run visual regression for scenario',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'scenarioId', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Comparison results' } }
    }
  },
  '/api/notifications/settings': {
    get: {
      tags: ['Notifications'],
      summary: 'Get notification settings',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'User notification settings' } }
    },
    put: {
      tags: ['Notifications'],
      summary: 'Update notification settings',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Updated settings' } }
    }
  },
  '/api/tokens': {
    get: {
      tags: ['CI/CD'],
      summary: 'List API tokens',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Token list' } }
    },
    post: {
      tags: ['CI/CD'],
      summary: 'Create API token',
      security: [{ bearerAuth: [] }],
      responses: { 201: { description: 'Token created' } }
    }
  },
  '/api/ci/run/{scenarioId}': {
    post: {
      tags: ['CI/CD'],
      summary: 'Run scenario via CI token',
      parameters: [
        { name: 'scenarioId', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'X-API-Token', in: 'header', required: true, schema: { type: 'string' } }
      ],
      security: [],
      responses: { 200: { description: 'Execution started' } }
    }
  }
}
