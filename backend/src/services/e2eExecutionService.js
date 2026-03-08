const { chromium } = require('playwright');
const { TestRun, TestResult } = require('../models');

class E2EExecutionService {
  async executeE2ETest(testCase, userId, io) {
    let browser;
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

      // Launch browser
      browser = await chromium.launch({
        headless: true,
        args: process.env.PLAYWRIGHT_LAUNCH_ARGS?.split(',') || ['--no-sandbox'],
      });

      const context = await browser.createContext();
      const page = await context.newPage();

      // Execute each step
      for (let i = 0; i < (testCase.testSteps?.length || 1); i++) {
        const step = testCase.testSteps[i] || {
          name: 'Default E2E Test',
          actions: [
            { type: 'goto', url: 'https://example.com' },
          ],
        };

        const stepResult = await this.executeE2EStep(page, step, i);
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

      // Close browser
      await context.close();
      await browser.close();

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
      console.error('E2E Execution error:', error);
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  }

  async executeE2EStep(page, step, stepIndex) {
    const startTime = Date.now();

    try {
      const actualResult = {
        actions: [],
        final_url: '',
        title: '',
      };

      if (!step.actions || step.actions.length === 0) {
        return {
          passed: false,
          actualResult,
          expectedResult: step.assertions || {},
          errorMessage: 'No actions defined',
          executionTime: Date.now() - startTime,
        };
      }

      // Execute each action in the step
      for (const action of step.actions) {
        const actionResult = await this.executeAction(page, action);
        actualResult.actions.push(actionResult);

        if (!actionResult.success) {
          throw new Error(`Action failed: ${actionResult.error}`);
        }
      }

      // Get final page state
      actualResult.final_url = page.url();
      actualResult.title = await page.title();

      // Validate assertions
      const passed = await this.validateE2EAssertions(page, step.assertions || {});

      const executionTime = Date.now() - startTime;

      return {
        passed,
        actualResult,
        expectedResult: step.assertions || {},
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        passed: false,
        actualResult: {
          error: error.message,
        },
        expectedResult: step.assertions || {},
        errorMessage: error.message,
        executionTime,
      };
    }
  }

  async executeAction(page, action) {
    try {
      switch (action.type) {
        case 'goto':
          await page.goto(action.url, { waitUntil: 'networkidle', timeout: 30000 });
          return { success: true, action: action.type, url: action.url };

        case 'click':
          await page.click(action.selector, { timeout: 10000 });
          return { success: true, action: action.type, selector: action.selector };

        case 'fill':
          await page.fill(action.selector, action.text);
          return { success: true, action: action.type, selector: action.selector };

        case 'type':
          await page.type(action.selector, action.text);
          return { success: true, action: action.type, selector: action.selector };

        case 'press':
          await page.press(action.selector, action.key);
          return { success: true, action: action.type, key: action.key };

        case 'wait':
          await page.waitForTimeout(action.ms || 1000);
          return { success: true, action: action.type, ms: action.ms };

        case 'waitForSelector':
          await page.waitForSelector(action.selector, { timeout: 10000 });
          return { success: true, action: action.type, selector: action.selector };

        default:
          return { success: false, error: `Unknown action type: ${action.type}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async validateE2EAssertions(page, assertions) {
    try {
      if (!assertions || Object.keys(assertions).length === 0) {
        return true;
      }

      // Check URL assertion
      if (assertions.url && !page.url().includes(assertions.url)) {
        return false;
      }

      // Check title assertion
      if (assertions.title && (await page.title()) !== assertions.title) {
        return false;
      }

      // Check element visibility
      if (assertions.visibleSelector) {
        const element = await page.$(assertions.visibleSelector);
        if (!element) return false;
      }

      // Check text content
      if (assertions.containsText) {
        const content = await page.content();
        if (!content.includes(assertions.containsText)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new E2EExecutionService();
