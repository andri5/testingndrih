# 📋 Semantic Commit Conventions

This project follows **Conventional Commits** specification for clear, semantic version control and automated changelog generation.

---

## 📝 Commit Format

```
<type>(<scope>): <description>

<body>

<footer>
```

### **Type** (required)
Must be one of:

| Type | Purpose | Example |
|------|---------|---------|
| `feat` | New feature | `feat: add Playwright headless recorder` |
| `fix` | Bug fix | `fix: resolve step extraction timeout` |
| `docs` | Documentation | `docs: update API documentation` |
| `test` | Test additions/changes | `test: add unit tests for recorder` |
| `refactor` | Code refactor | `refactor: simplify executor logic` |
| `perf` | Performance improvement | `perf: optimize database queries` |
| `ci` | CI/CD changes | `ci: add release workflow` |
| `chore` | Dependencies, configs | `chore: upgrade Playwright to 1.40+` |

### **Scope** (optional but recommended)
Scope helps identify which part of the codebase is affected:

```
recorder        (recording engine)
executor        (execution engine)
scheduler       (test scheduling)
auth            (authentication)
ui              (user interface)
db              (database)
api             (API endpoints)
docs            (documentation)
build           (build system)
```

### **Description** (required)
- Use imperative mood ("add" not "adds" or "added")
- Don't capitalize first letter
- No period (.) at the end
- Maximum 100 characters

---

## ✅ EXAMPLES

### ✅ GOOD Examples

```bash
# New feature with scope
feat(recorder): add Playwright headless browser recording

# Bug fix with scope
fix(executor): resolve step timeout in wait strategy

# Documentation update
docs: update README with semantic commit guidelines

# Test additions
test(scheduler): add unit tests for CRON validation

# Performance optimization
perf(db): optimize execution history queries by 40%

# Code refactor
refactor(ui): reorganize component structure

# Dependency update
chore: upgrade dependencies to latest versions

# CI/CD changes
ci: add GitHub Actions semantic release workflow

# Multiple type+scope
fix(auth): resolve JWT token expiration handling
refactor(api): simplify error response structure
```

### ❌ BAD Examples

```bash
# ❌ No type
update database

# ❌ Not semantic
fixed stuff
changes
update terbaru
commit k

# ❌ Wrong format
Fix: bug in recorder
FEAT: Add Feature

# ❌ Too long
feat: implement complex feature that includes many different improvements and refactoring

# ❌ Capital letter
Feat: add new feature
```

---

## 🔨 Breaking Changes

For breaking changes, add `BREAKING CHANGE:` in the commit body or use `!` in the type:

### Method 1: Using `!`
```bash
feat!: redesign API authentication flow
```

### Method 2: In commit body
```bash
feat(api): redesign authentication flow

BREAKING CHANGE: Authentication endpoint changed from /auth/login to /api/auth/login
```

---

## 📊 Version Bumping

Based on commit type, versions auto-bump:

```
feat:       MINOR bump   (v2.0.0 → v2.1.0)
fix:        PATCH bump   (v2.0.0 → v2.0.1)
BREAKING:   MAJOR bump   (v2.0.0 → v3.0.0)
docs/test/ci/chore: NO VERSION BUMP
```

---

## 🔐 Git Hooks (Enforced)

This project uses **commitlint** + **husky** to automatically validate commits:

```bash
# Git hook automatically checks your commit messages
# If invalid → commit rejected with error message
# If valid → commit accepted
```

### Manual validation (before committing):
```bash
# Test your message before committing
echo "feat: add new feature" | npx commitlint
```

---

## 🚀 Workflow Example

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/add-scheduler

# 2. Make changes and commit with semantic message
git add .
git commit -m "feat(scheduler): add CRON-based test scheduling"

# 3. Test commits (husky validates automatically)
# ✅ Commit accepted

# 4. Push and create PR
git push origin feature/add-scheduler

# 5. After PR merge to develop
# → Team tests on staging

# 6. Create release PR (develop → main)
# → After merge, semantic-release auto-triggers:
#   - Analyzes commits since last tag
#   - Bumps version (v2.0.0 → v2.1.0)
#   - Generates CHANGELOG.md
#   - Creates git tag v2.1.0
#   - Creates GitHub release
#   - Commits back to repo
```

---

## 📋 Commit Checklist

Before pushing, ensure:

- [ ] Commit type is valid (feat, fix, docs, etc)
- [ ] Scope is relevant (optional but recommended)
- [ ] Description is clear and imperative mood
- [ ] Description is < 100 characters
- [ ] No period at end of description
- [ ] Breaking changes noted if applicable
- [ ] Related issue/PR referenced if applicable

---

## 🤔 Common Questions

### Q: What if I make a typo in the commit message?

**A**: Use `git commit --amend` to fix the last commit:
```bash
git commit --amend -m "feat(scheduler): add CRON-based scheduling"
git push --force-with-lease origin feature/your-branch
```

### Q: Can I use multiple types in one commit?

**A**: No, create separate commits:
```bash
git commit -m "feat(scheduler): add scheduling"
git commit -m "test(scheduler): add unit tests"
git commit -m "docs: update scheduler docs"
```

### Q: Why enforce semantic commits?

**A**: 
- Automated versioning (no manual version bumps)
- Auto-generated, accurate CHANGELOG.md
- Clear git history
- Professional project management
- Better team communication

### Q: How to see all commits since last release?

**A**:
```bash
git log v2.0.0..HEAD --oneline
```

---

## 📚 References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Semantic Release Docs](https://semantic-release.gitbook.io/)
- [Commitlint Docs](https://commitlint.js.org/)

---

**Questions?** Check existing commits for examples or open an issue! 🚀
