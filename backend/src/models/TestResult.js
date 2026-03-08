const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TestResult = sequelize.define('TestResult', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  testRunId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  stepIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  stepName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  passed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  actualResult: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  expectedResult: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  executionTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Execution time in milliseconds',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: 'test_results',
});

module.exports = TestResult;
