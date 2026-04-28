/**
 * Semantic Release Configuration
 * Auto-versioning, changelog generation, and GitHub releases
 */

export default {
  branches: ['main'],
  tagFormat: 'v${version}',
  
  plugins: [
    // Analyze commits and determine version bump
    '@semantic-release/commit-analyzer',
    
    // Generate release notes
    '@semantic-release/release-notes-generator',
    
    // Update CHANGELOG.md
    ['@semantic-release/changelog', {
      changelogFile: 'CHANGELOG.md',
      changelogTitle: '# Test Sambil Ngopi Coy Changelog\n\nAll notable changes to this project will be documented in this file.',
    }],
    
    // Create GitHub release
    '@semantic-release/github',
    
    // Commit CHANGELOG.md and package.json back to repository
    ['@semantic-release/git', {
      assets: ['package.json', 'backend/package.json', 'frontend/package.json', 'CHANGELOG.md'],
      message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
    }]
  ]
};
