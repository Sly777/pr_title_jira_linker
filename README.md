<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>

# JIRA Linker on PR Title and Branch

## Example Usage

```
- name: PR Title Jira Linker
  uses: Sly777/pr_title_jira_linker@v1.0.4
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Full Example with branch name information

```
- name: PR Title Jira Linker
	uses: Sly777/pr_title_jira_linker@v1.0.4
	id: prtitlecheck
	env:
		GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

- uses: marocchino/sticky-pull-request-comment@v2
	if: always() && (steps.prtitlecheck.outputs.errortype == 'jiraonbranch')
	with:
		header: prbranchissue
		message: |
			We require branch names must have JIRA ticket ID if it's not ignored branch. Please update your branch name with ticket ID or use ignore branch pattern

			Current Branch name: ${{ steps.prtitlecheck.outputs.branchname }}
			Branch Ignore Pattern: '^(master|main|dev|develop|development|release|(nojira-.*))$'

- if: ${{ steps.prtitlecheck.outputs.errortype == null }}
	uses: marocchino/sticky-pull-request-comment@v2
	with:
		header: prbranchissue
		delete: true
```
