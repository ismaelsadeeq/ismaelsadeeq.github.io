---
layout: post
title: Managing Multiple Projects with Git Worktrees
date: 2026-01-30
description: A guide to using Git worktrees for managing multiple branches and tasks simultaneously.
tags: git productivity workflow
categories: technical
---

Git worktrees are a nifty feature that allows me to work on multiple branches simultaneously within a single repository. Instead of constantly switching branches and dealing with uncommitted changes, I use worktrees to provide isolated working directories for each branch.

#### The Problem with Branch Checkouts

When working on multiple features, I often encounter a common scenario: I'm in the middle of implementing a feature with uncommitted changes when I need to switch to another branch. My traditional Git workflow offered two main solutions, each with drawbacks:

*   **Creating wip/intermediate commit:** While this preserves my work, I must recompile the entire codebase when switching branches. Additionally, I need to either amend commits or perform soft resets when returning to my work, cluttering my Git history.
*   **Using git stash:** Stashing becomes problematic when I'm managing multiple stashes. I have to remember stash indices or inspect each stash before applying it, often leading to applying the wrong stash to the wrong branch.

Both approaches share another limitation: each time I switch branches and recompile, I lose access to the previous branch's compiled binaries, making it impossible to run experiments across different projects' binaries without manually saving them in a separate directory.

#### How Git Worktrees Solve These Problems

Git worktrees eliminate these pain points by creating separate working directories for each feature. Instead of switching branches within a single directory, I organise my work into multiple directories, each containing a different branch.

I leverage it to organise my repository like this:

```
bitcoin-core/
```

``` 
bitcoin-core/bitcoin/              (main branch)
```
``` 
bitcoin-core/fee-estimation/       (feature branch)
```

``` 
bitcoin-core/block-template-cache/ (feature branch)
```

Each directory operates independently with its own working tree, staged changes, and compiled binaries. I can open my editor in any directory and work without affecting the others.

#### Creating a New Worktree

Creating a worktree is straightforward. From my main repository, I use the `git worktree add` command:

```bash
git worktree add ../scaling-btc
```

This creates a new directory at the specified path with a clean checkout of my repository. I can now navigate to that directory and work independently:

```bash
cd ../scaling-btc
nvim .
```

When I need to switch contexts, I simply navigate to a different worktree directory. No recompilation needed, no stash management required.

#### Handling Untracked Files

One limitation of worktrees is that they only include Git-tracked files. Configuration files, build scripts, and environment files that aren't tracked by Git won't be copied to new worktrees. However, I easily solve this with a post-checkout hook.

A post-checkout hook is a Git script that runs automatically after I check out a branch. I use it to copy necessary files from my main repository to new worktrees.

#### Setting Up a Post-Checkout Hook

I create the hook file at `.git/hooks/post-checkout` in my main repository:

{% highlight bash linenos %}
#!/usr/bin/env bash
if [[ "$1" == "0000000000000000000000000000000000000000" ]]; then
    main_git_dir=$(git rev-parse --git-common-dir)
    main_work_tree=$(dirname "$main_git_dir")
    work_tree=$(git rev-parse --show-toplevel)
    cp "$main_work_tree/.envrc" "$work_tree/.envrc"
    cp "$main_work_tree/.env" "$work_tree/.env"
    cp "$main_work_tree/build_and_test.sh" "$work_tree/build_and_test.sh"
    cd "$work_tree" && direnv allow && chmod +x build_and_test.sh
    echo "worktree setup completed"
fi
{% endhighlight %}

This script does the following:

1.  Detects when a new worktree is being created by checking for the special commit hash.
2.  Identifies the main repository directory using `git rev-parse --git-common-dir`.
3.  Copies necessary files from the main repository to the new worktree.
4.  Makes scripts executable.

Make the hook executable:

```bash
chmod +x .git/hooks/post-checkout
```

Now, whenever I create a new worktree, the hook automatically copies my configuration files, ensuring each worktree has everything it needs to function properly.

Happy Hacking :)


#### References

*   [Using Git Hooks When Creating Worktrees](https://mskelton.dev/bytes/using-git-hooks-when-creating-worktrees)
*   [Git Hooks Documentation](https://git-scm.com/docs/githooks/2.10.5)
*   [Git Worktree Documentation](https://git-scm.com/docs/git-worktree)
