const User = require('./User');
const TestCase = require('./TestCase');
const TestRun = require('./TestRun');
const TestResult = require('./TestResult');

// Define associations
User.hasMany(TestCase, { foreignKey: 'createdBy', as: 'testCases' });
TestCase.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(TestRun, { foreignKey: 'executedBy', as: 'testRuns' });
TestRun.belongsTo(User, { foreignKey: 'executedBy', as: 'executor' });

TestCase.hasMany(TestRun, { foreignKey: 'testCaseId', as: 'runs' });
TestRun.belongsTo(TestCase, { foreignKey: 'testCaseId', as: 'testCase' });

TestRun.hasMany(TestResult, { foreignKey: 'testRunId', as: 'testResults' });
TestResult.belongsTo(TestRun, { foreignKey: 'testRunId', as: 'testRun' });

module.exports = {
  User,
  TestCase,
  TestRun,
  TestResult,
};
