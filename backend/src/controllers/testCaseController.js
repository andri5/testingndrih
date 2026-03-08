const { TestCase } = require('../models');

const testCaseController = {
  getAll: async (req, res) => {
    try {
      const testCases = await TestCase.findAll({
        where: { createdBy: req.user.id },
        order: [['createdAt', 'DESC']],
      });

      return res.json({ testCases });
    } catch (error) {
      console.error('Get all test cases error:', error);
      return res.status(500).json({ error: 'Failed to fetch test cases' });
    }
  },

  getById: async (req, res) => {
    try {
      const testCase = await TestCase.findByPk(req.params.id);

      if (!testCase || testCase.createdBy !== req.user.id) {
        return res.status(404).json({ error: 'Test case not found' });
      }

      return res.json({ testCase });
    } catch (error) {
      console.error('Get test case error:', error);
      return res.status(500).json({ error: 'Failed to fetch test case' });
    }
  },

  create: async (req, res) => {
    try {
      const { name, description, type, testSteps, expectedResults } = req.body;

      if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' });
      }

      if (!['API', 'E2E'].includes(type)) {
        return res.status(400).json({ error: 'Type must be API or E2E' });
      }

      const testCase = await TestCase.create({
        name,
        description,
        type,
        createdBy: req.user.id,
        testSteps: testSteps || [],
        expectedResults: expectedResults || {},
      });

      return res.status(201).json({
        message: 'Test case created successfully',
        testCase
      });
    } catch (error) {
      console.error('Create test case error:', error);
      return res.status(500).json({ error: 'Failed to create test case' });
    }
  },

  update: async (req, res) => {
    try {
      const testCase = await TestCase.findByPk(req.params.id);

      if (!testCase || testCase.createdBy !== req.user.id) {
        return res.status(404).json({ error: 'Test case not found' });
      }

      const { name, description, testSteps, expectedResults, isActive } = req.body;

      if (name) testCase.name = name;
      if (description !== undefined) testCase.description = description;
      if (testSteps) testCase.testSteps = testSteps;
      if (expectedResults) testCase.expectedResults = expectedResults;
      if (isActive !== undefined) testCase.isActive = isActive;

      await testCase.save();

      return res.json({
        message: 'Test case updated successfully',
        testCase
      });
    } catch (error) {
      console.error('Update test case error:', error);
      return res.status(500).json({ error: 'Failed to update test case' });
    }
  },

  delete: async (req, res) => {
    try {
      const testCase = await TestCase.findByPk(req.params.id);

      if (!testCase || testCase.createdBy !== req.user.id) {
        return res.status(404).json({ error: 'Test case not found' });
      }

      await testCase.destroy();

      return res.json({ message: 'Test case deleted successfully' });
    } catch (error) {
      console.error('Delete test case error:', error);
      return res.status(500).json({ error: 'Failed to delete test case' });
    }
  },
};

module.exports = testCaseController;
