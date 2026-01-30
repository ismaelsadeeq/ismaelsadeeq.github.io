---
layout: post
title: Managing Multiple Projects with Git Worktrees
date: 2026-01-30
description: A guide to using Git worktrees for managing multiple branches and tasks simultaneously.
tags: git productivity workflow
categories: technical
---

Git worktrees are a powerful feature that allows developers to work on multiple branches simultaneously within a single repository. Instead of constantly switching branches and dealing with uncommitted changes, worktrees provide isolated working directories for each branch or task.

### The Problem with Manual Branch Checkouts

When working on multiple features or bug fixes, developers often encounter a common scenario: you're in the middle of implementing a feature with uncommitted changes when you need to switch to another branch. Traditional Git workflows offer two main solutions, each with drawbacks:

*   **Creating WIP commits:** While this preserves your work, you must recompile the entire codebase when switching branches. Additionally, you need to either amend commits or perform soft resets when returning to your work, cluttering your Git history.
*   **Using git stash:** Stashing becomes problematic when managing multiple stashes. You must remember stash indices or inspect each stash before applying it, often leading to applying the wrong stash to the wrong branch.

Both approaches share another significant limitation: each time you switch branches and recompile, you lose access to the previous branch's compiled binaries, making it impossible to run experiments across different projects' binaries without manually saving binaries.

### How Git Worktrees Solve These Problems

Git worktrees eliminate these pain points by creating separate working directories for each feature. Instead of switching branches within a single directory, you organise your work into multiple directories, each containing a different branch.

For example, instead of constantly switching between branches in a single directory, you might organise your repository like this:

```
bitcoin-core/
    bitcoin/              (main branch)
    fee-estimation/       (feature branch)
    block-template-cache/ (feature branch)
```

Each directory operates independently with its own working tree, staged changes, and compiled binaries. You can open your editor in any directory and work without affecting the others.

### Creating a New Worktree

Creating a worktree is straightforward. From your main repository, use the `git worktree add` command:

```bash
git worktree add ../scaling-btc
```

This creates a new directory at the specified path with a clean checkout of your repository. You can now navigate to that directory and work independently:

```bash
cd ../scaling-btc
nvim .
```

When you need to switch contexts, simply navigate to a different worktree directory. No recompilation needed, no stash management required.

### Handling Untracked Files

One limitation of worktrees is that they only include Git-tracked files. Configuration files, build scripts, and environment files that aren't tracked by Git won't be copied to new worktrees. However, this is easily solved with a post-checkout hook.

A post-checkout hook is a Git script that runs automatically after checking out a branch. You can use it to copy necessary files from your main repository to new worktrees.

### Setting Up a Post-Checkout Hook

Create the hook file at `.git/hooks/post-checkout` in your main repository:

```bash
#!/usr/bin/env bash
if [[ "$1" == "0000000000000000000000000000000000000000" ]]; then
    main_git_dir=$(git rev-parse --git-common-dir)
    main_work_tree=$(dirname "$main_git_dir")
    work_tree=$(git rev-parse --show-toplevel)
    
    cp "$main_work_tree/.envrc" "$work_tree/.envrc"
    cd "$work_tree" && direnv allow
    
    cp "$main_work_tree/build_and_test.sh" "$work_tree/build_and_test.sh"
    cd "$work_tree" && chmod +x build_and_test.sh
    
    cp "$main_work_tree/.env" "$work_tree/.env"
    
    echo "worktree setup completed"
fi
```

This script does the following:

1.  Detects when a new worktree is being created by checking for the special commit hash.
2.  Identifies the main repository directory using `git rev-parse --git-common-dir`.
3.  Copies necessary files from the main repository to the new worktree.
4.  Makes build scripts executable.

Make the hook executable:

```bash
chmod +x .git/hooks/post-checkout
```

Now, whenever you create a new worktree, the hook automatically copies your configuration files, ensuring each worktree has everything it needs to function properly.

### Benefits of Using Worktrees

*   **No recompilation:** Each worktree maintains its own build artifacts, eliminating the need to recompile when switching contexts.
*   **Preserved state:** Staged, unstaged, and committed changes remain exactly as you left them in each worktree.
*   **Parallel experimentation:** Keep compiled binaries from different branches available simultaneously for testing and comparison.
*   **Clean history:** No need for WIP commits or complex stash management.
*   **Faster context switching:** Simply navigate to a different directory rather than checking out branches and waiting for compilation.

### References

*   [Using Git Hooks When Creating Worktrees](https://mskelton.dev/bytes/using-git-hooks-when-creating-worktrees)
*   [Git Hooks Documentation](https://git-scm.com/docs/githooks/2.10.5)
*   [Git Worktree Documentation](https://git-scm.com/docs/git-worktree)
