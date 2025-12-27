---
layout: post
title: "Bitcoind Block Policy Fee Rate Estimator Modes Analysis"
date: 2024-06-24
description: Analysis of Bitcoind estimatesmartfee modes
tags: Bitcoin Bitcoind  Feerate-Estimation
categories: technical analysis
---

This analysis examines the fee estimation data from Block `846887` to `847322`, covering a total of `435` blocks, to analyze the difference between estimates from the [Bitcoind Policy Estimator](https://johnnewbery.com/an-intro-to-bitcoin-core-fee-estimation/) in `conservative` and `economical` modes.

### Methodology

- Logged and traced conservative and economical fee estimates every minute.
- Logged and traced all connected blocks’ percentile fee rates ([branch implementation](https://github.com/ismaelsadeeq/bitcoin/tree/new-fee-estimator-data)).
- Collected and cleaned data from both the traced and debug logs ([data](https://gist.github.com/ismaelsadeeq/6a6531e9b96bfeed20178e353b187332)).
- Analyzed the data by plotting Bitcoind conservative and economical estimates against the confirmed block target (50th–5th percentile fee rate range).

### Definitions

- **Conservative mode**: The `estimatesmartfee` RPC mode which considers a longer history of blocks. It potentially returns a higher fee rate and is more likely to be sufficient for the desired target, but it is not as responsive to short-term drops in the prevailing fee market.
- **Economical mode**: The `estimatesmartfee` RPC mode where estimates are potentially lower and more responsive to short-term drops in the prevailing fee market.
- **Overpaid estimates**: An estimate above the 50th percentile fee rate of the target block.
- **Underpaid estimates**: An estimate below the 5th percentile fee rate of the target block.
- **Estimates within range**: An estimate that falls between the 5th and 50th percentile fee rates of the target block.

### Data Summary for Bitcoind `estimatesmartfee`

A total of **13,718** estimates were made from `2024-06-07 12:18:25` to `2024-06-10 07:48:05`, spanning Block `846886` to Block `847321`, with confirmation targets of 1 and 2 blocks.

| Estimator                 | Overpaid Estimates | Underpaid Estimates | Estimates Within Range |
|---------------------------|--------------------|---------------------|------------------------|
| Bitcoind Conservative     | 3760 (96.14%)      | 66 (1.69%)          | 85 (2.17%)             |
| Bitcoind Economic         | 3033 (77.55%)      | 433 (11.07%)        | 445 (11.38%)           |

### Log-Scale Graphs

<div class="row mt-4">
  <div class="col-md-9">
    <figure>
      <img class="img-fluid rounded z-depth-1"
           src="https://hackmd.io/_uploads/Syp1xVPBC.png"
           alt="Log-scale estimates block 846887–847087">
      <figcaption class="mt-2 text-muted">
        Estimates from block <code>846887</code> to <code>847087</code> plotted on a log scale.
      </figcaption>
    </figure>
  </div>
</div>

<div class="row mt-4">
  <div class="col-md-9">
    <figure>
      <img class="img-fluid rounded z-depth-1"
           src="https://hackmd.io/_uploads/SyKxxVDHC.png"
           alt="Log-scale estimates block 847087–847287">
      <figcaption class="mt-2 text-muted">
        Estimates from block <code>847087</code> to <code>847287</code> plotted on a log scale.
      </figcaption>
    </figure>
  </div>
</div>

## Absolute Value Scale

<div class="row mt-4">
  <div class="col-md-9">
    <figure>
      <img class="img-fluid rounded z-depth-1"
           src="https://hackmd.io/_uploads/r1svgVwBR.png"
           alt="Absolute scale estimates block 846887–847087">
      <figcaption class="mt-2 text-muted">
        Estimates from block <code>846887</code> to <code>847087</code> plotted using absolute values.
      </figcaption>
    </figure>
  </div>
</div>

<div class="row mt-4">
  <div class="col-md-9">
    <figure>
      <img class="img-fluid rounded z-depth-1"
           src="https://hackmd.io/_uploads/HyUueNwS0.png"
           alt="Absolute scale estimates block 847087–847287">
      <figcaption class="mt-2 text-muted">
        Estimates from block <code>847087</code> to <code>847287</code> plotted using absolute values.
      </figcaption>
    </figure>
  </div>
</div>

You can recreate these graphs, summaries, and more from the repository using the
[`analyse-bitcoind-estimates` branch](https://github.com/ismaelsadeeq/fee-estimates-analysis/tree/analyse-bitcoind-estimates).

### Key Findings

- This empirical data shows that the economical mode has a much lower overestimation compared to the conservative mode.
- These graphs show that the economical mode responds much quicker to recent fee market adjustments than the conservative mode.
- A previous analysis used the economical mode, but this was incorrectly reported in
  [Bitcoin issue #30009](https://github.com/bitcoin/bitcoin/issues/30009).

### Worst-Case Overestimation Example

Block `847088` was confirmed with a 50th percentile fee rate of **38.7 sat/vB**.

- `estimatesmartfee` conservative mode: **505.7 sat/vB**
- `estimatesmartfee` economical mode: **48.3 sat/vB**

<div class="row mt-4">
  <div class="col-md-7">
    <figure>
      <img class="img-fluid rounded z-depth-1"
           src="https://hackmd.io/_uploads/BkDOfNwHC.png"
           alt="Worst-case fee estimate comparison">
      <figcaption class="mt-2 text-muted">
        Worst-case overestimation example for block <code>847088</code>.
      </figcaption>
    </figure>
  </div>
</div>

Many transactions paid this high fee to get included, as seen
[here](https://mempool.space/block/0000000000000000000074877b16a3ca2a512114f731fc76e226ec77dcfc38db).

For an average P2WPKH 2-input 2-output transaction weighing approximately
`208.5` vbytes, the costs are:

- **Bitcoind economical estimate**: `208.5 × 48.3 = 10071 satoshis (≈ $6.73)`
- **Bitcoind conservative estimate**: `208.5 × 505.7 = 105438 satoshis (≈ $70.52)`

Using the conservative estimate results in paying **15× more than necessary**.
This excessive overestimation persists for extended periods, causing many
transactions to significantly overpay.

<div class="row mt-4">
  <div class="col-md-7">
    <figure>
      <img class="img-fluid rounded z-depth-1"
           src="https://hackmd.io/_uploads/BJijzNDBC.png"
           alt="Persistent conservative overestimation">
      <figcaption class="mt-2 text-muted">
        Persistent overestimation by the conservative estimator across multiple blocks.
      </figcaption>
    </figure>
  </div>
</div>

This analysis reveals that the overestimation by the conservative mode is not an
isolated incident but a recurring trend. Given the current fee market behavior,
this warrants modifying the default estimation mode to **economical** to reduce
systematic overpayment.

---

### References

- [Mempool-based fee estimation on Bitcoin Core](https://delvingbitcoin.org/t/mempool-based-fee-estimation-on-bitcoin-core/703/8)
- [Bitcoin Core PR #30157](https://github.com/bitcoin/bitcoin/pull/30157)

