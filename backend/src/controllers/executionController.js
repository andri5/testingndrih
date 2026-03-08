const { TestRun, TestCase } = require('../models');
const apiExecutionService = require('../services/apiExecutionService');
const e2eExecutionService = require('../services/e2eExecutionService');
const reportService = require('../services/reportService');

const executionController = {
  execute: async (req, res) => {
    try {
      const { testCaseId } = req.body;
      const userId = req.user.id;

      if (!testCaseId) {
        return res.status(400).json({ error: 'testCaseId is required' });
      }

      const testCase = await TestCase.findByPk(testCaseId);
      if (!testCase) {
        return res.status(404).json({ error: 'Test case not found' });
      }

      if (testCase.createdBy !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Start execution in background
      const io = req.app.locals.io;

      // Route to appropriate execution service based on test type
      const executionService = testCase.type === 'E2E' ? e2eExecutionService : apiExecutionService;
      const methodName = testCase.type === 'E2E' ? 'executeE2ETest' : 'executeAPITest';

      executionService[methodName](testCase, userId, io).catch((error) => {
        console.error('Background execution error:', error);
        io.emit('execution:error', {
          testCaseId,
          error: error.message,
        });
      });

      return res.json({
        message: 'Test execution started',
        testCaseId,
      });
    } catch (error) {
      console.error('Execute error:', error);
      return res.status(500).json({ error: 'Failed to start test execution' });
    }
  },

  getResults: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const execution = await TestRun.findByPk(id, {
        include: [
          { association: 'testCase', attributes: ['name', 'type'] },
          { association: 'executor', attributes: ['name', 'email'] },
          { association: 'testResults', as: 'testResults' },
        ],
      });

      if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      // Verify user owns this test case
      const testCase = await TestCase.findByPk(execution.testCaseId);
      if (testCase.createdBy !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      return res.json({ execution });
    } catch (error) {
      console.error('Get results error:', error);
      return res.status(500).json({ error: 'Failed to fetch execution results' });
    }
  },

  getHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const { testCaseId } = req.query;

      let where = {};
      if (testCaseId) {
        where.testCaseId = testCaseId;
      }

      // Get all test cases by user to filter executions
      const testCases = await TestCase.findAll({
        where: { createdBy: userId },
        attributes: ['id'],
      });

      const testCaseIds = testCases.map((tc) => tc.id);

      const executions = await TestRun.findAll({
        where: { testCaseId: testCaseIds, ...where },
        include: [
          { association: 'testCase', attributes: ['name', 'type'] },
          { association: 'executor', attributes: ['name', 'email'] },
        ],
        order: [['startTime', 'DESC']],
        limit: 50,
      });

      return res.json({ executions });
    } catch (error) {
      console.error('Get history error:', error);
      return res.status(500).json({ error: 'Failed to fetch execution history' });
    }
  },

  getSummary: async (req, res) => {
    try {
      const userId = req.user.id;

      // Get all test cases by user
      const testCases = await TestCase.findAll({
        where: { createdBy: userId },
        attributes: ['id'],
      });

      const testCaseIds = testCases.map((tc) => tc.id);

      // Get all executions
      const executions = await TestRun.findAll({
        where: { testCaseId: testCaseIds },
      });

      const totalExecutions = executions.length;
      const passedExecutions = executions.filter((e) => e.status === 'passed').length;
      const failedExecutions = executions.filter((e) => e.status === 'failed').length;

      const averageDuration = executions.length > 0
        ? Math.round(executions.reduce((sum, e) => sum + (e.duration || 0), 0) / executions.length)
        : 0;

      return res.json({
        summary: {
          totalExecutions,
          passedExecutions,
          failedExecutions,
          passRate: totalExecutions > 0 ? Math.round((passedExecutions / totalExecutions) * 100) : 0,
          averageDuration,
        },
      });
    } catch (error) {
      console.error('Get summary error:', error);
      return res.status(500).json({ error: 'Failed to fetch summary' });
    }
  },

  stop: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const execution = await TestRun.findByPk(id);
      if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      if (execution.status !== 'running') {
        return res.status(400).json({ error: 'Execution is not running' });
      }

      await execution.update({
        status: 'stopped',
        endTime: new Date(),
      });

      const io = req.app.locals.io;
      io.emit('execution:stopped', {
        executionId: id,
      });

      return res.json({
        message: 'Execution stopped',
        execution,
      });
    } catch (error) {
      console.error('Stop execution error:', error);
      return res.status(500).json({ error: 'Failed to stop execution' });
    }
  },

  export: async (req, res) => {
    try {
      const { id } = req.params;
      const { format } = req.query;
      const userId = req.user.id;

      if (!format || !['json', 'csv', 'pdf'].includes(format)) {
        return res.status(400).json({ error: 'Invalid format. Use: json, csv, or pdf' });
      }

      const execution = await TestRun.findByPk(id, {
        include: [
          { association: 'testCase', attributes: ['name', 'type'] },
          { association: 'executor', attributes: ['name', 'email'] },
          { association: 'testResults', as: 'testResults' },
        ],
      });

      if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      // Verify user owns this test case
      const testCase = await TestCase.findByPk(execution.testCaseId);
      if (testCase.createdBy !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      let data;
      let contentType;
      let filename;

      switch (format) {
        case 'json':
          data = JSON.stringify(reportService.generateJSON(execution), null, 2);
          contentType = 'application/json';
          filename = `test-report-${id}.json`;
          break;

        case 'csv':
          data = reportService.generateCSV(execution);
          contentType = 'text/csv';
          filename = `test-report-${id}.csv`;
          break;

        case 'pdf':
          const doc = reportService.generatePDF(execution);
          data = doc.output('arraybuffer');
          contentType = 'application/pdf';
          filename = `test-report-${id}.pdf`;
          break;

        default:
          return res.status(400).json({ error: 'Invalid format' });
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      if (format === 'pdf') {
        res.send(Buffer.from(data));
      } else {
        res.send(data);
      }
    } catch (error) {
      console.error('Export error:', error);
      return res.status(500).json({ error: 'Failed to export report' });
    }
  },
};

module.exports = executionController;
