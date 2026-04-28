/**
 * Commitlint Configuration
 * Enforces conventional commit messages
 */

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',      // New feature
        'fix',       // Bug fix
        'docs',      // Documentation
        'test',      // Test additions/changes
        'refactor',  // Code refactor
        'perf',      // Performance improvements
        'ci',        // CI/CD changes
        'chore'      // Dependencies, configs
      ]
    ],
    'type-case': [2, 'always', 'lowercase'],
    'subject-empty': [2, 'never'],
    'subject-max-length': [2, 'always', 100],
    'subject-period': [2, 'never']
  }
};
