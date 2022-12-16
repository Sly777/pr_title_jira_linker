import * as core from '@actions/core'
import * as github from '@actions/github'

export interface PullRequestParams {
  number: number
  html_url?: string
  body?: string
  base: {
    ref: string
  }
  head: {
    ref: string
  }
  changed_files?: number
  additions?: number
  title?: string
  [key: string]: unknown
}

export interface actionInputs {
  conventionalCommitPattern: string
  jiraTicketPattern: string
  messagePattern: string
  ignoredBranchesPattern: string
  replaceAll: boolean
}

export enum checkPRTitleReturns {
  INCLUDED,
  NOT_INCLUDED,
  ERROR
}

const defaultConfig: actionInputs = {
  conventionalCommitPattern:
    '^([a-z]+)(\\([a-z0-9.,-_ ]+\\))?!?: ([\\w \\S]+)$',
  jiraTicketPattern: '([A-Z]+-\\d+)',
  messagePattern: '[$J] $M',
  ignoredBranchesPattern:
    '^(master|main|dev|develop|development|release|(nojira-.*))$',
  replaceAll: true
}

function escapeReplacement(str: string): string {
  return str.replace(/[$]/, '$$$$')
}

export function getBranchName(): string {
  core.debug('gitBranchName')

  const pullRequest = github.context.payload.pull_request as PullRequestParams
  const {
    head: {ref: headBranch},
    base: {ref: baseBranch}
  } = pullRequest

  core.debug(`Base branch -> ${baseBranch}`)
  core.debug(`Head branch -> ${headBranch}`)

  if (!headBranch || !baseBranch) {
    core.setFailed('Action not find branches')
    return ''
  }

  core.debug(`get branch name : ${headBranch}`)
  return headBranch
}

export function getJiraTicket(branchName: string): string {
  core.debug('getJiraTicket')

  const jiraIdPattern = new RegExp(getConfig().jiraTicketPattern, 'i')
  const matched = jiraIdPattern.exec(branchName)
  const jiraTicket = matched && matched[0]

  core.debug(`get jira ticket : ${jiraTicket}`)
  return jiraTicket ? jiraTicket.toUpperCase() : ''
}

export function getPRTitle(): string {
  const pullRequest = github.context.payload.pull_request as PullRequestParams
  if (!pullRequest) {
    core.setFailed('Action not run in pull_request context.')
    return ''
  }

  const prTitle = pullRequest.title

  if (!prTitle) {
    core.setFailed('Action couldnt find the title on PR')
    return ''
  }

  core.debug(`get pr title : ${prTitle}`)
  return prTitle
}

export function getConfig(config?: any): actionInputs {
  if (config) {
    const result = {...defaultConfig, ...config.config}
    core.debug(`Used config: ${JSON.stringify(result)}`)
    return result
  }

  return defaultConfig
}

export function getFormattedPRTitle(
  jiraTicket: string,
  message: string
): string {
  core.debug(`getFormattedPRTitle: ${jiraTicket} - ${message}`)
  const config = getConfig()

  const jiraTicketRegExp = new RegExp('\\$J', config.replaceAll ? 'g' : '')
  const messageRegExp = new RegExp('\\$M', config.replaceAll ? 'g' : '')
  const result = config.messagePattern
    .replace(jiraTicketRegExp, escapeReplacement(jiraTicket))
    .replace(messageRegExp, escapeReplacement(message))

  core.debug(`Replacing message: ${result}`)

  return result
}

export function conventionalTitle(
  message: string,
  jiraTicket: string
): string | undefined {
  core.debug(`conventionalTitle: ${message} - ${jiraTicket}`)
  const config = getConfig()

  const conventionalCommitRegExp = new RegExp(
    config.conventionalCommitPattern,
    'g'
  )
  conventionalCommitRegExp.lastIndex = -1
  const [match, type, scope, msg] = conventionalCommitRegExp.exec(message) ?? []
  if (match) {
    core.debug(`Conventional commit message: ${match}`)

    if (!msg.includes(jiraTicket)) {
      const replacedMessage = getFormattedPRTitle(jiraTicket, msg)

      return `${type}${scope || ''}: ${replacedMessage}`
    } else {
      core.debug(`jira ticket included on title`)
    }
  } else {
    core.debug(`error on conventionalTitle - ${match}`)
    core.setFailed(
      `PR title format is not correct, it must follow conventional commit standard`
    )
  }
}

export function checkPRTitle(
  message: string,
  jiraTicket: string
): checkPRTitleReturns {
  core.debug(`checkPRTitle: ${message} - ${jiraTicket}`)
  const config = getConfig()

  const conventionalCommitRegExp = new RegExp(
    config.conventionalCommitPattern,
    'g'
  )
  conventionalCommitRegExp.lastIndex = -1
  const [match, _type, _scope, msg] =
    conventionalCommitRegExp.exec(message) ?? []

  if (match) {
    if (!msg.includes(jiraTicket)) {
      core.debug('jira ticket not included on title')
      return checkPRTitleReturns.NOT_INCLUDED
    } else {
      core.debug(`jira ticket included on title`)
      return checkPRTitleReturns.INCLUDED
    }
  } else {
    core.debug(`there is an issue on title - ${match}`)
    return checkPRTitleReturns.ERROR
  }
}

export function checkBranch(branchName: string): boolean {
  core.debug(`checkBranch: ${branchName}`)
  const config = getConfig()
  const ignored = new RegExp(config.ignoredBranchesPattern || '^$', 'i')

  if (ignored.test(branchName)) {
    core.debug('The branch is ignored by the configuration rule')
    return false
  }

  core.debug('branch name is correct')
  return true
}
