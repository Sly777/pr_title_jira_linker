import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  checkBranch,
  checkPRTitle,
  checkPRTitleReturns,
  conventionalTitle,
  getBranchName,
  getJiraTicket,
  getPRTitle
} from './config'

async function run(): Promise<void> {
  try {
    const token = process.env['GITHUB_TOKEN']
    if (!token) {
      core.setFailed('Requires: GITHUB_TOKEN')
      return
    }

    if (github.context.eventName !== 'pull_request') {
      core.info(`Skipping PR: this isn't a pull_request event for us to handle`)
      core.info(
        `Tip: if you think this is a mistake, did you make sure to run this action in a 'pull_request' event?`
      )
      return
    }

    const PRTitle = getPRTitle()
    const branchName = getBranchName()
    const jiraID = getJiraTicket(branchName ?? '')

    if (!PRTitle || !branchName || !jiraID) {
      core.setFailed('Actions variables are empty')
      return
    }

    core.debug(`PRTitle: ${PRTitle}`)
    core.debug(`branchName: ${branchName}`)
    core.debug(`jiraID: ${jiraID}`)

    if (!checkBranch(branchName)) {
      core.debug('The branch is ignored by the configuration rule')
      core.setOutput('errortype', 'branchignore')
      core.setOutput('branchname', branchName)
      core.setOutput('title', PRTitle)
      return
    }

    if (checkPRTitle(PRTitle, jiraID) === checkPRTitleReturns.INCLUDED) {
      core.debug('PR has correct title format already')
      return
    }

    if (checkPRTitle(PRTitle, jiraID) === checkPRTitleReturns.ERROR) {
      core.setFailed('PR title has some issues')
      core.setOutput('errortype', 'prtitle')
      core.setOutput('branchname', branchName)
      core.setOutput('title', PRTitle)
      return
    }

    // there is no reason to have ignore check here because it checks earlier
    if (!getJiraTicket(branchName)) {
      core.setFailed('Branch name has no Jira Ticket ID')
      core.setOutput('errortype', 'jiraonbranch')
      core.setOutput('branchname', branchName)
      core.setOutput('title', PRTitle)
      return
    }

    const formattedTitle = conventionalTitle(PRTitle, jiraID)

    core.debug(`Formatted text : ${formattedTitle}`)

    const octokit = github.getOctokit(token)
    const pull_number = github.context.payload.pull_request!.number
    const owner = github.context.repo.owner
    const repo = github.context.repo.repo

    await octokit.rest.pulls.update({
      owner,
      repo,
      pull_number,
      title: formattedTitle
    })
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
