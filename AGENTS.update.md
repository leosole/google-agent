# Update & Rebase Mode

All user interaction happens through the LLM (chat interface), never via CLI prompts.
This mode checks for updates in the current branch and rebases with conflict resolution.
Runs at most **once per day** (tracked by `.tmp/last-update-check`).

## When to use

- At the start of a session, check once if updates exist.
- If the user explicitly asks to update, always run it.

## Steps

1. **Check for updates**:

   ```bash
   git fetch --all
   git rev-list --count HEAD..@{u}
   ```

   - Fetch the remote and check if the local branch is behind.
   - Also print the incoming commit log: `git log --oneline HEAD..@{u}`
   - Track the check with `echo $(date +%Y-%m-%d) > .tmp/last-update-check`

2. **Ask the user** (only if updates were found):

   Use the `question` tool to ask the user if they want to apply the updates.
   Show them the commit log so they can decide.

3. **Apply updates** (if user agrees):

   ```bash
   git stash push -m "auto-stash before rebase"
   git rebase @{u}
   ```

   - Stash any local changes first.
   - If conflicts occur, auto-resolve by taking the remote version:
     ```bash
     git checkout --theirs <conflicted-file>
     git add <conflicted-file>
     git rebase --continue
     ```
   - Pop the stash afterward.

4. **Conflict edge-cases** (if auto-resolution fails):
   - If rebase --continue still fails, try `git rebase --skip` to skip the problematic commit.
   - If that also fails, **use the `question` tool** to ask the user how to proceed.

## Manual trigger (user asks "update" directly)

If the user says something like "update the repo" or "pull the latest changes":

1. Perform the rebase directly with `git fetch --all && git rebase @{u}` (stashing first).
2. Resolve any conflicts as described above.
3. Confirm with `git status` and `git log --oneline -5`.
4. Report back what changed.

## Post-update verification

After a successful rebase:

```bash
git status
git log --oneline -5
```

If anything looks off, notify the user.
