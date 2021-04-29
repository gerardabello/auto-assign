# Auto assign github action

Randomly assigns a number of assignees to every PR from a pool.

## Example worflow

```yaml
name: 'Auto assign pull request'
on:
  pull_request:
    types: [opened, ready_for_review]

jobs:
  auto-assign:
    runs-on: ubuntu-latest
    steps:
      - uses: gerardabello/auto-assign@v1
        with:
          github-token: "${{ secrets.GITHUB_TOKEN }}"
          number-of-assignees: 2
          assignee-pool: |
            user1
            user2
            user3
```
