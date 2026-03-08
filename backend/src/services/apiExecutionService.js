const axios = require('axios');
const { TestRun, TestResult, TestCase } = require('../models');

class APIExecutionService {
  async executeAPITest(testCase, userId, io) {
    try {
      // Create test run record
      const testRun = await TestRun.create({
        testCaseId: testCase.id,
        executedBy: userId,
        status: 'running',
        totalSteps: testCase.testSteps.length || 1,
      });

      // Emit start event via Socket.io
      io.emit('execution:start', {
        executionId: testRun.id,
        testCaseName: testCase.name,
      });

      const results = [];
      let passedSteps = 0;
      let failedSteps = 0;

      // Execute each step
      for (let i = 0; i < (testCase.testSteps.length || 1); i++) {
        const step = testCase.testSteps[i] || {
          name: 'Default Test',
          url: 'https://api.github.com',
          method: 'GET',
          headers: {},
          body: null,
        };

        const stepResult = await this.executeStep(step, i);
        results.push(stepResult);

        if (stepResult.passed) {
          passedSteps++;
        } else {
          failedSteps++;
        }

        // Emit step complete event
        io.emit('step:complete', {
          executionId: testRun.id,
          stepIndex: i,
          stepName: step.name || `Step ${i + 1}`,
          passed: stepResult.passed,
          executionTime: stepResult.executionTime,
        });

        // Save individual result
        await TestResult.create({
          testRunId: testRun.id,
          stepIndex: i,
          stepName: step.name || `Step ${i + 1}`,
          passed: stepResult.passed,
          actualResult: stepResult.actualResult,
          expectedResult: stepResult.expectedResult,
          errorMessage: stepResult.errorMessage || null,
          executionTime: stepResult.executionTime,
        });
      }

      // Update test run with final results
      const finalStatus = failedSteps === 0 ? 'passed' : 'failed';
      const duration = results.reduce((sum, r) => sum + (r.executionTime || 0), 0);

      await testRun.update({
        status: finalStatus,
        results,
        endTime: new Date(),
        passedSteps,
        failedSteps,
        duration,
      });

      // Emit completion event
      io.emit('execution:complete', {
        executionId: testRun.id,
        status: finalStatus,
        passedSteps,
        failedSteps,
        duration,
      });

      return testRun;
    } catch (error) {
      console.error('API Execution error:', error);
      throw error;
    }
  }

  async executeStep(step, stepIndex) {
    const startTime = Date.now();

    try {
      const config = {
        method: step.method || 'GET',
        url: step.url,
        timeout: parseInt(process.env.API_TIMEOUT || 30000),
      };

      if (step.headers) {
        config.headers = step.headers;
      }

      if (step.body && (step.method === 'POST' || step.method === 'PUT' || step.method === 'PATCH')) {
        config.data = typeof step.body === 'string' ? JSON.parse(step.body) : step.body;
      }

      const response = await axios(config);

      const executionTime = Date.now() - startTime;
      const passed = this.validateResponse(response, step.assertions || {});

      return {
        passed,
        actualResult: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
        },
        expectedResult: step.assertions || {},
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        passed: false,
        actualResult: {
          error: error.message,
          code: error.code,
        },
        expectedResult: step.assertions || {},
        errorMessage: error.message,
        executionTime,
      };
    }
  }

  validateResponse(response, assertions) {
    if (!assertions || Object.keys(assertions).length === 0) {
      // If no assertions, just check for 2xx status
      return response.status >= 200 && response.status < 300;
    }

    // Check status code assertion
    if (assertions.statusCode && response.status !== assertions.statusCode) {
      return false;
    }

    // Check response body assertions
    if (assertions.containsText && !JSON.stringify(response.data).includes(assertions.containsText)) {
      return false;
    }

    // Check response includes key
    if (assertions.includesKey && !response.data.hasOwnProperty(assertions.includesKey)) {
      return false;
    }

    return true;
  }
}

module.exports = new APIExecutionService();
