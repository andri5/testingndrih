#!/usr/bin/env node
/**
 * Safe push for main: fetch, rebase if behind origin, then push.
 * Avoids "tip of your current branch is behind" after semantic-release bot commits.
 */
import { execSync } from 'node:child_process'

function run(cmd, options = {}) {
  execSync(cmd, { stdio: 'inherit', ...options })
}

function runCapture(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim()
}

const remote = process.argv[2] || 'origin'
const branch = runCapture('git branch --show-current')

if (!branch) {
  console.error('Not on a branch (detached HEAD). Checkout a branch first.')
  process.exit(1)
}

console.log(`Syncing ${branch} with ${remote}...`)
run(`git fetch ${remote} ${branch}`)

try {
  const behind = runCapture(`git rev-list --count HEAD..${remote}/${branch}`)
  if (Number(behind) > 0) {
    console.log(`Branch is ${behind} commit(s) behind ${remote}/${branch}. Rebasing...`)
    run(`git pull --rebase ${remote} ${branch}`)
  } else {
    console.log('Already up to date with remote.')
  }
} catch {
  console.log(`No remote branch ${remote}/${branch} yet — pushing for the first time.`)
}

run(`git push ${remote} ${branch}`)
console.log('Push completed.')
