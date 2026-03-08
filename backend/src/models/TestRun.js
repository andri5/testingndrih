const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TestRun = sequelize.define('TestRun', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  testCaseId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  executedBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('running', 'passed', 'failed', 'stopped'),
    defaultValue: 'running',
  },
  startTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  results: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of step results',
  },
  logs: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  totalSteps: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  passedSteps: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  failedSteps: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in milliseconds',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: 'test_runs',
});

module.exports = TestRun;
