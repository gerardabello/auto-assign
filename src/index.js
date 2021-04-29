import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'

const GITHUB_TOKEN_KEY = 'github-token'
const NUMBER_OF_ASSIGNEES_KEY = 'number-of-assignees'
const ASSIGNEE_POOL_KEY = 'assignee-pool'

function pickRandomFromArray(arr) {
  if (arr.length === 0) {
    throw new Error('Internal error: cannot pick random from empty list')
  }

  return arr[Math.floor(Math.random() * arr.length)]
}

function pickNRandomFromArray(arr, n) {
  const result = []
  for (let i = 0; i < n; i++) {
    const arrayWithoutPickedOnes = arr.filter((a) => !result.includes(a))
    const newRandom = pickRandomFromArray(arrayWithoutPickedOnes)
    result.push(newRandom)
  }

  return result
}

function hasExistingAssignees() {
  return context.payload.pull_request.assignees.length > 0
}

function isPullRequest() {
  return context.payload.pull_request != null
}

function isDraft() {
  return context.payload.pull_request.draft
}

function getPRAuthor() {
  return context.payload.pull_request.user.login
}

function getRepoName() {
  return context.payload.repository.name
}

function getPRNumber() {
  return context.payload.pull_request.number
}

function getRepoOwner() {
  return context.payload.repository.owner.login
}

function pickAssignees() {
  const numberOfAssignees = core.getInput(NUMBER_OF_ASSIGNEES_KEY, {
    required: true,
  })

  const assigneePool = core
    .getInput(ASSIGNEE_POOL_KEY, { required: true })
    .split('\n')
    .map((a) => a.trim())

  const author = getPRAuthor()

  if (assigneePool.length < numberOfAssignees) {
    throw new Error(
      'The pool size is smaller than the desired number of assignees.'
    )
  }

  const assigneePoolWithoutAuthor = assigneePool.filter((a) => a !== author)

  if (assigneePoolWithoutAuthor.length < numberOfAssignees) {
    throw new Error(
      'The pool size, after removing the author of the PR, is smaller than the desired number of assignees.'
    )
  }

  return pickNRandomFromArray(assigneePoolWithoutAuthor, numberOfAssignees)
}

async function addAsignees(assignees) {
  const token = core.getInput(GITHUB_TOKEN_KEY, { required: true })

  const number = getPRNumber()
  const owner = getRepoOwner()
  const repo = getRepoName()

  const octokit = getOctokit(token)

  await octokit.issues.addAssignees({
    owner,
    repo,
    issue_number: number,
    assignees,
  })

  core.info(`New pull request assignees: ${assignees.join(', ')}.`)
}

async function main() {
  if (!isPullRequest()) {
    throw new Error(
      'No pull request found. The auto-assign action only works for pull requests'
    )
  }

  if (isDraft()) {
    core.info(`Pull request is still a draft. Skipping.`)
    return
  }

  if (hasExistingAssignees()) {
    core.info(`Pull request has existing assignees. Skipping.`)
    return
  }

  await addAsignees(pickAssignees())
}

async function run() {
  try {
    await main()
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
