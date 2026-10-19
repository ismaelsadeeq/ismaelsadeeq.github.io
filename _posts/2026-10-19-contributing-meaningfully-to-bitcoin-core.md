---
layout: post
title: Contributing Meaningfully to Bitcoin Core
date: 2026-10-19
description: Notes from a hands-on session with Btrust Builders fellows on the Bitcoin Core development process, with a walkthrough of reviewing a small PR.
tags: bitcoin bitcoin-core open-source code-review
categories: technical
---

I was invited to speak to the [Btrust Builders](https://btrust.tech) fellows about the Bitcoin Core development process and to share insights that would help African developers contribute effectively. The organisers left the format open, so instead of a slide presentation I went with a hands-on session: we walked through the repository together and finished by reviewing a real pull request. This post is a write-up of that session.

#### What is Bitcoin Core?

Bitcoin Core is the reference implementation of the Bitcoin protocol. It connects you to the peer-to-peer network, downloads and validates blocks, lets you submit transactions to the network, and can be used for mining. It also ships with a wallet and a graphical user interface.

It is an open-source project with a diverse set of contributors and a flat governance structure.

#### How to Contribute

Mechanically, contributing to Bitcoin Core is like contributing to any other open-source project: there are long-running projects, issues, and pull requests. Getting started, however, can be overwhelming. As a newcomer you don't really know what is what, or where work is actually needed.

Broadly, I think of contributors in two groups: **user contributors** and **passionate contributors**.

#### User Contributors

A user contributor is a technical person who uses the software regularly. They notice an issue and file it, open a PR to fix it, or propose a new feature based on their needs. Many contributions come from this group: Lightning developers, wallet users, miners, and so on. Their direction comes naturally from using the software.

#### Passionate Contributors

A passionate contributor doesn't fall into the category above but wants to contribute anyway. We've seen an influx of passionate contributors recently, in large part due to incentives from grant-giving organisations.

Unfortunately, a lot of the time this kind of contribution doesn't end up being meaningful, and in the worst case it becomes a drain on the project: low-signal PRs and reviews that cost maintainers and reviewers time without moving anything forward. Knowing how to be a passionate contributor *and* contribute meaningfully is not obvious, so the rest of this post focuses on a few hints for doing that.

#### Set Your Expectations

Bitcoin Core is not a regular company. There are no tickets, assigned priorities, or managers who will guide you. From the outside it looks mostly unorganised, and the interesting part is that the work still gets done.

Don't get me wrong, there is still some level of organisation. But it is not like a company where a PM hand-holds new hires and interns, and someone instantly mentors you or reviews your direction. If you need that kind of structure, this is probably not the right place to build a career. You have to be self-directed.

#### Build and Run the Software

The first thing I recommend is to build and run Bitcoin Core from source. It is easy to do; follow the build instructions for your platform in the [`doc/`](https://github.com/bitcoin/bitcoin/tree/master/doc) directory.

Then read through the [contributing guidelines](https://github.com/bitcoin/bitcoin/blob/master/CONTRIBUTING.md) and the [developer notes](https://github.com/bitcoin/bitcoin/blob/master/doc/developer-notes.md). If you're already familiar with Bitcoin as a technology this will be easier. If not, expect double the work: you're learning how to contribute and learning the technology at the same time.

#### Get Familiar with the Codebase

After compiling, spend some time getting familiar with the code. The C++ codebase is quite modular, and most file names describe their contents, so simply skimming through the source tree is very useful for building a mental map.

#### A Live Review Session

To make this concrete, we reviewed a PR together. Given the time constraint, we picked a small one at random:

[#36320 — test: refactor: make chain_dir consistent with CreateBaseChainParams](https://github.com/bitcoin/bitcoin/pull/36320)

We started by reading the title and the PR description.

#### On Using LLMs for Review

LLMs are now part of most developers' workflows, so we approached this review with one. To be fair, you'll often learn more by reviewing *without* an LLM, because you're forced to figure everything out yourself. That said, LLM-assisted review can be very valuable and speed things up. It depends entirely on *how* you use it.

My setup was simple: the LLM window open side by side with my code editor.

**A bad review** is prompting the LLM with "review this and find issues" and posting what comes back. The LLM will indeed review it, and may find real issues or false positives. Since you're new, you won't necessarily be able to tell which is which. You end up giving the author more work, since they now have to review your LLM's output, and you didn't learn anything. You're essentially front-running tokens to the author and acting as an LLM proxy.

**A better approach** is to use the LLM as a tool for your own understanding, as described below.

#### Step 1: Look at the Files Touched

First, look at which files the PR changes and briefly read what each of them does. In this case everything was under `test/functional`:

*   `test_framework/test_framework.py`
*   `test_framework/test_node.py`
*   `test_framework/util.py`
*   `mining_mainnet.py`
*   `rpc_validateaddress.py`

We read through each of them to understand what they test.

#### Step 2: Note What You Don't Understand, and Research It

Write down what you understand and what you don't, then research the gaps. This gives you an instant win without having reviewed anything yet: you've learned something.

As a new contributor, your goal should mostly be learning and being useful, not hunting for the author's mistakes. If you do spot a mistake, point it out politely. Finding bugs should be a nice by-product, not the objective.

#### Step 3: Review Commit by Commit

Next, read the changes commit by commit. This PR has a single commit, so there was just one to review. Git knowledge (or an LLM) helps here. You could ask the LLM to explain the changes line by line alongside the commit message, but I prefer to do this by hand:

```bash
git show <commit-hash>
```

Reading through, the core change is in `test/functional/test_framework/test_node.py`; everything else follows from it. An LLM can identify the main change for you up front, but here I wanted to figure it out myself. Some PR authors point out the main change in the description to help reviewers. When you find it yourself, it's worth mentioning in your review so future reviewers benefit (and it would be useful to me too if I came back to review a later revision). A tool that surfaces this automatically would be nice.

#### Step 4: Cross-Check Against the Source

After reading the main change, I cross-checked it against the code it references, in this case the actual `CreateBaseChainParams` in the C++ source, to make sure the test framework now matches it. Then I moved on to reviewing the side effects of the change.

#### Step 5: Dig Into the Confusing Parts

All the other changes made sense, except one in `test_framework/util.py` that translates the chain name to a config section name. That one wasn't immediately clear to me, so I asked the LLM to explain it, and it did.

The reason it maps mainnet to `None` is that mainnet settings don't live under a named section in `bitcoin.conf`; only the non-mainnet chains need a section header such as `[signet]` or `[testnet4]`.

To make sure nothing was missed, I grepped for the remaining occurrences of `self.chain` to confirm no call site had been left out.

#### Step 6: Run the Tests

Finally, I ran the affected functional tests and confirmed they pass.

#### Step 7: Leave Your Review

With all of that done, I left a comment and ACKed the PR with a description of what I reviewed and tested: [my review on #36320](https://github.com/bitcoin/bitcoin/pull/36320#pullrequestreview-5355643714).

The author addressed the feedback and pushed an update. Sometimes a PR that has been sitting without activity just needs a small nudge like this to get going again, which leads to subsequent ACKs and, eventually, a merge.

#### Closing Thoughts

This is a simple workflow for a simple PR. Other PRs warrant different approaches and much more scrutiny. For more thorough guides, see:

*   [Gloria Zhao's review checklist](https://github.com/glozow/bitcoin-notes/blob/master/review-checklist.md)
*   [Gloria Zhao's general review workshop notes](https://github.com/glozow/bitcoin-notes/blob/master/general-review-workshop.md)
*   [Google's code review guidelines for reviewers](https://google.github.io/eng-practices/review/reviewer/standard.html)

Thanks to the Btrust team for having me, and to the fellows for an engaging session.

Happy Hacking :)

#### References

*   [Bitcoin Core repository](https://github.com/bitcoin/bitcoin)
*   [CONTRIBUTING.md](https://github.com/bitcoin/bitcoin/blob/master/CONTRIBUTING.md)
*   [Developer Notes](https://github.com/bitcoin/bitcoin/blob/master/doc/developer-notes.md)
*   [PR #36320](https://github.com/bitcoin/bitcoin/pull/36320)
