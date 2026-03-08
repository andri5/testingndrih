const axios = require('axios');

/**
 * Qase.io API Integration Service
 * Syncs test cases from Qase.io to our application
 */
class QaseService {
  constructor() {
    this.baseURL = 'https://api.qase.io/v1';
    this.timeout = 30000;
  }

  /**
   * Create Axios instance with auth header
   */
  getClient(apiToken) {
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        'Token': apiToken,
        'Content-Type': 'application/json',
      },
      timeout: this.timeout,
    });
  }

  /**
   * Validate API token by fetching user info
   */
  async validateToken(apiToken) {
    try {
      const client = this.getClient(apiToken);
      const response = await client.get('/me');
      return {
        valid: true,
        user: response.data.result,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get all projects from Qase.io
   */
  async getProjects(apiToken) {
    try {
      const client = this.getClient(apiToken);
      const response = await client.get('/projects');
      return {
        success: true,
        projects: response.data.result.entities || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get test cases from specific Qase.io project
   * @param {string} apiToken - Qase.io API token
   * @param {string} projectCode - Project code (e.g., 'PROJ')
   * @param {number} limit - Number of test cases to fetch (default: 100)
   */
  async getTestCases(apiToken, projectCode, limit = 100) {
    try {
      const client = this.getClient(apiToken);
      const response = await client.get(`/cases/${projectCode}`, {
        params: {
          limit: limit,
        },
      });

      const testCases = response.data.result.entities || [];
      return {
        success: true,
        total: response.data.result.pagination?.total || testCases.length,
        testCases: testCases,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get test case details from Qase.io
   */
  async getTestCaseDetails(apiToken, projectCode, caseId) {
    try {
      const client = this.getClient(apiToken);
      const response = await client.get(`/cases/${projectCode}/${caseId}`);
      return {
        success: true,
        testCase: response.data.result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Transform Qase.io test case to our format
   */
  transformTestCase(qaseTestCase, projectCode) {
    const steps = [];

    // Parse steps if they exist
    if (qaseTestCase.steps && Array.isArray(qaseTestCase.steps)) {
      qaseTestCase.steps.forEach((step, index) => {
        steps.push({
          stepIndex: index,
          name: step.action || step.data || `Step ${index + 1}`,
          description: step.data || '',
          expectedResult: step.expected_result || '',
        });
      });
    }

    return {
      name: qaseTestCase.title,
      description: qaseTestCase.description || '',
      type: this._detectTestType(qaseTestCase),
      testSteps: steps.length > 0 ? steps : [
        {
          stepIndex: 0,
          name: qaseTestCase.title,
          description: qaseTestCase.description || '',
        },
      ],
      qaseMetadata: {
        qaseId: qaseTestCase.id,
        projectCode: projectCode,
        qaseTitle: qaseTestCase.title,
        qaseSeverity: qaseTestCase.severity || 'normal',
        qasePriority: qaseTestCase.priority || 'medium',
        qaseStatus: qaseTestCase.status || 'active',
        qaseUrl: `https://app.qase.io/testcase/${projectCode}-${qaseTestCase.id}`,
      },
    };
  }

  /**
   * Detect test type based on Qase.io test case content
   */
  _detectTestType(qaseTestCase) {
    const title = (qaseTestCase.title || '').toLowerCase();
    const description = (qaseTestCase.description || '').toLowerCase();
    const combined = title + ' ' + description;

    // Check for E2E indicators
    const e2eKeywords = ['browser', 'ui', 'click', 'navigate', 'element', 'screenshot', 'visual'];
    if (e2eKeywords.some(kw => combined.includes(kw))) {
      return 'E2E';
    }

    // Default to API
    return 'API';
  }

  /**
   * Get test runs from Qase.io
   */
  async getTestRuns(apiToken, projectCode, limit = 50) {
    try {
      const client = this.getClient(apiToken);
      const response = await client.get(`/runs/${projectCode}`, {
        params: {
          limit: limit,
        },
      });

      return {
        success: true,
        runs: response.data.result.entities || [],
        total: response.data.result.pagination?.total || 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get test run results
   */
  async getTestRunResults(apiToken, projectCode, runId) {
    try {
      const client = this.getClient(apiToken);
      const response = await client.get(`/runs/${projectCode}/${runId}/results`);

      return {
        success: true,
        results: response.data.result.entities || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }
}

module.exports = new QaseService();
