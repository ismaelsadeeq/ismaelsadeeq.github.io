---
layout: post
title: "Bitcoin Core PR #32317 Review: Separating UTXO Access from Validation"
date: 2026-04-16
description: Review notes on the PR that moves coin access out of ConnectBlock, and why the two goals behind it are independent and should be pursued separately.
tags: bitcoin bitcoin-core validation code-review
categories: technical
---

These are my review notes on [Bitcoin Core PR #32317](https://github.com/bitcoin/bitcoin/pull/32317), which separates UTXO access from block validation. Status: **on review**.

#### PR Description

The current code makes it hard to call functions for checking the consensus-correctness of a block without having a full UTXO set at hand. This makes implementing features such as Utreexo and non-assumevalid SwiftSync — where maintaining a full UTXO set defeats their purpose — through the kernel API difficult. Checks like the coinbase subsidy or block sigops are only available through `ConnectBlock`, which requires a complete coins cache.

This PR solves the problem by moving coin access and the responsibility of spending them out of `ConnectBlock` and into a new separate function called `SpendBlock`. A block's spent coins are passed through the existing `CBlockUndo` data structure to `ConnectBlock`.

While the change is largely a refactor, some smaller behaviour changes were unavoidable and are highlighted in the commit messages. The last commit contains the most important part of the coins logic move; the commits before it prepare the ground incrementally.

This PR was benchmarked on benchcoin, which showed no performance regression. It was noted during discussion that pre-fetching and eliminating some additional map lookups might improve performance slightly, but this does not make a measurable difference in the grand scheme of things and was not the motivation for this PR.

In future changes, `ConnectBlock` could be made even more self-contained, access to coins from the internal map could be further optimised by consolidating existence checking and spending, and the function could eventually be exposed through an external kernel API.

### Major Comments

#### 1. AJTowns — Against

- Architectural disagreement: Bitcoin Core uses a UTXO model and the UTXO set is always available. What justifies the cost of this change?
- No proof-of-concept client has been built on top of this PR. Where is the demonstrated benefit?
- The change is risky. Validation is complex, and it is easy to miss crashes or subtle bugs during a refactor of this scope.
- If the main motivation is to allow external clients to validate blocks, why wasn't a simpler and less risky alternative explored first? For example, an overlay `BlocksUndoViewCache` passed to the block validation functions. ([comment](https://github.com/bitcoin/bitcoin/pull/32317#issuecomment-3277131901))
- The lifetime of coins returned from `AccessCoin` is not predictable when using a reference. If the cache is invalidated, this is a hazard. A copy should be returned instead. ([comment](https://github.com/bitcoin/bitcoin/pull/32317#issuecomment-3269734161))

#### 2. Coryfields — In Favour, with Conditions

- Agrees the change is scary and needs careful review, but considers it worth the effort. Wants a design where callers can bring their own coins to validation, which he believes will be easier to reason about. ([review](https://github.com/bitcoin/bitcoin/pull/32317#pullrequestreview-3945910108))
- Using a span of coin references with an unspecified lifetime is risky; prefers a callback-based design. ([comment](https://github.com/bitcoin/bitcoin/pull/32317#discussion_r2932834948)) AJTowns also suggests applying RCU (read-copy-update) semantics to the coins cache to resolve the mystery-lifetime concern. ([comment](https://github.com/bitcoin/bitcoin/pull/32317#discussion_r2950392410))
- Prefers refactoring `CCoinsViewCache` to return and store shared pointers, eliminating lifetime concerns entirely. This should enable introducing new types — `ContextualTransaction` and `ContextualBlock` — where `SpendBlock` takes a `CBlock` as input, converts each `CTransaction` into a `ContextualTransaction` storing a `shared_ptr<Coin>`, and returns a `ContextualBlock` (rather than a `CBlock` and `BlockUndo`) for `ConnectBlock` to consume. ([comment](https://github.com/bitcoin/bitcoin/pull/32317#discussion_r2956402281))

#### 3. Others

Stickies, Stringintech, enirox00, and ismaelsadeeq are in agreement on the stated advantages of the PR.

### Remarks

This PR has two distinct motivations that emerged from the discussion:

1. Enabling clients to provide their own coins for block validation.
2. Decoupling the validation functions, improving the coins view cache, and rearchitecting the block validation flow.

These two motivations overlap but are not in conflict, and it would be better to pursue them separately.

Goal (i) can be achieved without making goal (ii) a dependency. A Bitcoin kernel API could accept a chain tip, a block, and the coins that block consumed, and use those directly for validation. This interface is agnostic to internals — it simply accepts inputs and returns a block validation state. Internally, any model could be used: the block-undo approach in PR #32317, the coins view approach (creating a `pindex` for the input tip, using the block input, constructing a dummy coins view and performing `TestBlockValidity` should be straightforward to implement and test A/B), or another.

We should ideally also have comparison testing against the current `TestBlockValidity` path to verify correctness. See [this branch](https://github.com/ismaelsadeeq/bitcoin/tree/04-2026-test-block-validity-spentouts) for an implementation of this idea (the first three commits are useful for common master; I'll PR them shortly).

Goal (ii) does not conflict with goal (i). The architectural refactors — all of which reviewers agree should be done — can proceed methodically and incrementally, with comprehensive testing of prior behaviour and fuzzing at each step.

It is worth noting that the coins view approach has some risks as well: the BIP30 duplicate-txid check may not be performed if the client does not supply the full UTXO set. Additionally, the client-provided `pindex` chain tip and the kernel chainstate manager's active chainstate tip may not match, which could cause failures in any internal validation call that relies on the manager tip or on some unset `pindex` fields.

That said, this risk exists equally in the block-and-`BlockUndo` approach, so comprehensive A/B comparison testing between `TestBlockValidity` and `TestBlockValidityWithSpentCoinsUndo` is required in either case.

### Proposed Action Steps

1. Create `TestBlockValidityWithSpentCoins` implementing the approach from #32317. **Done** ([link](https://github.com/ismaelsadeeq/bitcoin/tree/pr-32317))
2. Expose it through the Bitcoin kernel API. **Done** ([link](https://github.com/ismaelsadeeq/bitcoin/tree/pr-32317))
3. Build a Rust binding and a SwiftSync node that performs a full sync using this path.
4. Create a `TestBlockValidityWithSpentCoins` variant implementing the coins view cache approach. **Done** ([link](https://github.com/ismaelsadeeq/bitcoin/tree/04-2026-test-block-validity-spentouts))
5. Expose it through the Bitcoin kernel API. **Done** ([link](https://github.com/ismaelsadeeq/bitcoin/tree/04-2026-test-block-validity-spentouts))
6. Build a Rust binding for the API above, and verify that the SwiftSync node can use either one interchangeably.

The choice of which `TestBlockValidity` variant is called should have no observable effect on external behaviour, demonstrating that this is purely an internal Bitcoin Core design decision.

### Footnotes

If the above demonstration succeeds, I am inclined toward a concept ACK on the decoupling work. However, the claim that goal (ii) is a prerequisite for goal (i) is false — they are independent. This PR should therefore be split:

- One PR focused solely on goal (ii): decoupling, and implementing the architectural improvements suggested by AJTowns and Coryfields, done incrementally with rigorous fuzz and unit tests.
- A separate PR focused on goal (i): the coins view cache approach, `TestBlockValidityWithSpentCoins`, the Bitcoin kernel bindings, and the SwiftSync integration. After goal (ii) is achieved, it should be easy to change the internals of `TestBlockValidityWithSpentCoins`.

### References

- [Bitcoin Core PR #32317](https://github.com/bitcoin/bitcoin/pull/32317)
- [Block-undo implementation branch](https://github.com/ismaelsadeeq/bitcoin/tree/pr-32317)
- [Coins view implementation branch](https://github.com/ismaelsadeeq/bitcoin/tree/04-2026-test-block-validity-spentouts)
