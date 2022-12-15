import {expect, test} from '@jest/globals'
import {
  checkBranch,
  checkPRTitle,
  checkPRTitleReturns,
  conventionalTitle,
  getFormattedPRTitle
} from '../src/config'

test('getFormattedPRTitle', async () => {
  const input = getFormattedPRTitle('TEST-11', 'feat: test example info')
  expect(input).toEqual('[TEST-11] feat: test example info')
})

test('conventionalTitle', async () => {
  expect(conventionalTitle('feat: test example info', 'TEST-11')).toEqual(
    'feat: [TEST-11] test example info'
  )
  expect(conventionalTitle('fix: test example info', 'TEST-11')).toEqual(
    'fix: [TEST-11] test example info'
  )
  expect(conventionalTitle('test example info', 'TEST-11')).toBeUndefined()
})

test('checkPRTitle', async () => {
  expect(checkPRTitle('feat: [TEST-11] test example info', 'TEST-11')).toEqual(
    checkPRTitleReturns.INCLUDED
  )
  expect(checkPRTitle('[TEST-11] test example info', 'TEST-11')).toEqual(
    checkPRTitleReturns.ERROR
  )
  expect(checkPRTitle('feat: test example info', 'TEST-11')).toEqual(
    checkPRTitleReturns.NOT_INCLUDED
  )
})

test('checkBranch', async () => {
  expect(checkBranch('master')).toBeFalsy()
  expect(checkBranch('dev')).toBeFalsy()
  expect(checkBranch('nojira-testbranch')).toBeFalsy()
  expect(checkBranch('nojira-testtest')).toBeFalsy()
  expect(checkBranch('TEST-11')).toBeTruthy()
  expect(checkBranch('TEST-11_testbranch')).toBeTruthy()
  expect(checkBranch('TEST-11/testbranch')).toBeTruthy()
})
