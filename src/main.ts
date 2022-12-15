import * as core from '@actions/core'
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
    const PRTitle = getPRTitle()
    const branchName = getBranchName()
    const jiraID = getJiraTicket(branchName ?? '')

    if (!PRTitle || !branchName || !jiraID) {
      core.setFailed('Actions variables are empty')
      return
    }

    if (!checkBranch(branchName)) {
      core.debug('The branch is ignored by the configuration rule')
      return
    }

    if (checkPRTitle(PRTitle, jiraID) === checkPRTitleReturns.INCLUDED) {
      core.debug('PR has correct title format already')
      core.setOutput('formattedText', PRTitle)
      return
    }

    const formattedTitle = conventionalTitle(jiraID, PRTitle)

    core.debug(`Formatted text : ${formattedTitle}`)
    core.setOutput('formattedText', formattedTitle)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
