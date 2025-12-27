---
layout: post
title: "Challenges with Estimating Transaction Fee Rates"
date: 2023-11-16
description: This post explores the reasons why estimating how much to pay for your transaction as fee is challenging, and the ways to overcome these challenges.
tags: Bitcoin Transaction Feerate-Estimation
categories: technical
---

**Fee estimation** is the process of predicting the fee rate that a transaction should pay in order to be included in a certain number of blocks in the future.  
The fee rate is the fee paid per unit of transaction size.

Fee estimation is critical because it determines when a transaction is likely to be mined.  
Transactions are prioritized based on their fee rate; higher rates ensure faster confirmations, as miners favor them to maximize revenue.

Especially during periods of congestion, low–fee-rate transactions may linger and potentially never confirm.

Users must determine suitable fee rates, balancing confirmation speed and cost, aided by fee estimators.

Fee estimation is probabilistic and utilizes various data sources, including **historical block transactions**, **historical block transactions that the mempool has seen confirmed**, and **unconfirmed mempool transactions**.

### Challenges of Fee Estimation with Historical Block Transactions

- Gameable by miners: miners including high–fee-rate transactions in their mined blocks can influence future fee estimates. Those high–fee-rate transactions will impact future predictions.
- This method overlooks the current state of miners' mempools, which may be congested with high–fee-rate transactions or shallow with low–fee-rate transactions. Relying solely on previous block fee rates can lead to overpayment or underpayment.

### Challenges of Mempool-Based Fee Estimation

- Accurate fee estimation depends on having a fully validating node with a synchronized mempool.
- Mempool differences: the user's mempool may differ from the miner's mempool, leading to inaccurate predictions.
- Relying on external fee estimation services might introduce the risk of service providers colluding with miners to artificially inflate fee estimates.

### Challenges of Fee Estimation with Historical Blocks and Mempool Transactions Data

- This approach, based on transactions in the node's mempool that have been confirmed, reduces the risk of miners manipulating future predictions by publishing high–fee-rate transactions. The threat of other miners picking up these high–fee-rate transactions discourages manipulation. However, this method does not consider the current mempool size and is *package-unaware*, which reduces data points and, in some cases, leads to inaccurate assumptions.

### How Historical Blocks and Mempool Transactions Data Fee Estimation Falls Short

Bitcoin Core uses this historical block and mempool transaction data to estimate fees. The component that handles fee estimation is called `CBlockPolicyEstimator`.

> “Because it's solely based on historical data (looking at how long mempool transactions take to confirm), it cannot react quickly to changing conditions.”  
> — sipa

`CBlockPolicyEstimator` observes how long mempool transactions historically take to confirm. It assumes that if some number of mempool transactions with a certain fee rate have been confirmed after a specific number of blocks in the past, using that same fee rate for your transaction will likely result in a similar confirmation time.

However, this assumption may not hold if the mempool's state changes. The historical data may not accurately reflect the current situation.

> “Because it's aiming to match seen behaviour rather than a requirement, if some non-negligible fraction of users keeps paying a certain high feerate, it may try to match that, even if it is unnecessary for confirmation.”  
> — sipa

If a node's mempool primarily contains high–fee-rate transactions due to mempool differences, the mempool transactions that end up confirming will also be high–fee-rate transactions. This can lead to the `CBlockPolicyEstimator` producing high fee rate estimates. Transactions with such high fee rates will likely be confirmed in a short time, but at the cost of paying more than necessary.

Similarly, if the node’s mempool predominantly comprises low–fee-rate transactions, and the mempool transactions that confirm also have low fee rates, the `CBlockPolicyEstimator` will tend to provide lower fee estimates. Miners may be less likely to pick such transactions because they are not sufficiently incentivized to include them in a block. This reflects the estimator’s tendency to align with the observed behaviour of transactions that have historically been confirmed.

> “The new fee estimator is much better at reacting to large volatility in tx throughput, but ignores the mempool.”  
> — kallewoof

This statement implies that the `CBlockPolicyEstimator` is designed to react and adjust fee estimates based on historical data and trends related to how mempool transaction fee rates are confirmed over time. It takes into account the past behaviour of transactions in terms of their fee rates and confirmation times to predict future fee rates. However, it may not consider real-time or current conditions in the mempool when making these estimations, which could lead to discrepancies or inaccuracies during times of sudden changes or fluctuations in transaction throughput.

### Analysis to Confirm That `CBlockPolicyEstimator` Is Unreliable in Some Situations

I have been watching the blockchain for a while to verify the behavior of the `CBlockPolicyEstimator`. One instance where the mempool experienced congestion was between blocks **812593** and **812596**. This is an example of where the Bitcoin Core fee estimator was not reliable.

#### Fee Rate Estimates from **812593** to **812596**

| Block Height                          | EstimateSmartFee (2 blocks) | Mempool-Based Fee Estimate (High priority) | Average Fee Rate | Median Fee Rate |
|--------------------------------------|-----------------------------|--------------------------------------------|------------------|-----------------|
| Immediately after 812593 confirmed   | 18 s/vb                     | 22 s/vb                                     | N/A              | N/A             |
| 45 minutes after 812593              | 18 s/vb                     | 33 s/vb                                     | N/A              | N/A             |
| Block 812594 was confirmed           | 18 s/vb                     | 33 s/vb                                     | 44 s/vb          | 33 s/vb         |
| Block 812595 was confirmed           | 18 s/vb                     | 22 s/vb                                     | 25 s/vb          | 22 s/vb         |
| Block 812596 was confirmed           | 20 s/vb                     | 22 s/vb                                     | 23 s/vb          | 19 s/vb         |

![Graph of how it changes](https://hackmd.io/_uploads/Bk3FYPRzT.png)

The estimates above demonstrate how the `CBlockPolicyEstimator` operates during congestion, completely independent of the mempool's condition.

Thanks to Ishanaam and other Bitcoin Core developers, I was able to classify the wallets used by the mempool transaction dumps between **812594** and **812596** with the [wallet fingerprinting](https://ishaana.com/blog/wallet_fingerprinting/) tool.

I identified Bitcoin Core transactions by their wallet fingerprints and determined whether they use estimates from the `CBlockPolicyEstimator`, as well as the outcomes of transactions that use the `CBlockPolicyEstimator` and those that do not.

After block **812593** was mined, a new block was not found for more than an hour. This caused the mempool to become congested, and some users started broadcasting high–fee-rate transactions or fee-bumping already published ones to increase the chances of their transactions being picked by miners. This, in turn, raised the mempool-based fee estimate to **33 s/vb**, while `CBlockPolicyEstimator` was still providing **18 s/vb** for high-priority fee estimates.

The mempool state at that moment is shown below.

<iframe width="600" height="371" seamless frameborder="0" scrolling="no" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQrOX3TK3AswjhfNfc9gOx93Z-ODDID2GQlapoW0YlwB_v4lkjx17_A-5CasONVr7kyhBne2x6qmXpm/pubchart?oid=1181013940&amp;format=interactive"></iframe>

The high-priority target fee rate of **18 s/vb** from `CBlockPolicyEstimator` is significantly below the ancestor score of **38%** of fingerprinted Bitcoin Core transactions.

This demonstrates unequivocally that those transactions obtain their fee estimates from somewhere else. For example, they may be using the `fee_rate` field of the `sendtoaddress` RPC with the [mempool.space](https://mempool.space) fee rate estimate.

<iframe width="600" height="371" seamless frameborder="0" scrolling="no" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQrOX3TK3AswjhfNfc9gOx93Z-ODDID2GQlapoW0YlwB_v4lkjx17_A-5CasONVr7kyhBne2x6qmXpm/pubchart?oid=1061368107&amp;format=interactive"></iframe>

There are **116** transactions whose ancestor score falls within the **18 s/vb** high-priority estimate range of `CBlockPolicyEstimator`, accounting for **12.6%** of all Bitcoin Core transactions.

It is implied that the remaining **49.4%** of Bitcoin Core transactions may or may not be using `CBlockPolicyEstimator` as their fee estimator, because their ancestor scores were below that of `CBlockPolicyEstimator`.

After an hour and a few minutes, block **812594** was mined.

Below is the mempool state after **812594**.

<iframe width="600" height="371" seamless frameborder="0" scrolling="no" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQrOX3TK3AswjhfNfc9gOx93Z-ODDID2GQlapoW0YlwB_v4lkjx17_A-5CasONVr7kyhBne2x6qmXpm/pubchart?oid=1278002772&amp;format=interactive"></iframe>

**30%** of fingerprinted Bitcoin Core transactions after **812594** had an ancestor score above the `CBlockPolicyEstimator` high-priority target fee rate.

Some transactions paying more than the `CBlockPolicyEstimator` high-priority target fee rate were mined.

<iframe width="600" height="371" seamless frameborder="0" scrolling="no" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQrOX3TK3AswjhfNfc9gOx93Z-ODDID2GQlapoW0YlwB_v4lkjx17_A-5CasONVr7kyhBne2x6qmXpm/pubchart?oid=330620633&amp;format=interactive"></iframe>

Transactions whose ancestor scores are within the `CBlockPolicyEstimator` high-priority estimate range increased to **128**, or **14%** of transactions.

None of the transactions using the high-priority estimate were mined, and additional transactions were broadcast with the same **18 s/vb** estimate. `CBlockPolicyEstimator` continued to provide an **18 s/vb** estimate, while the mempool remained congested and the mempool-based fee estimate stayed at **33 s/vb**.

Block **812595** was discovered shortly afterward.

<iframe width="600" height="371" seamless frameborder="0" scrolling="no" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQrOX3TK3AswjhfNfc9gOx93Z-ODDID2GQlapoW0YlwB_v4lkjx17_A-5CasONVr7kyhBne2x6qmXpm/pubchart?oid=1405156454&amp;format=interactive"></iframe>

Only **12%** of fingerprinted Bitcoin Core transactions after **812595** had an ancestor score higher than the high-priority target fee rate set by `CBlockPolicyEstimator`.

<iframe width="600" height="371" seamless frameborder="0" scrolling="no" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQrOX3TK3AswjhfNfc9gOx93Z-ODDID2GQlapoW0YlwB_v4lkjx17_A-5CasONVr7kyhBne2x6qmXpm/pubchart?oid=687911508&amp;format=interactive"></iframe>

Transactions whose ancestor score is within the `CBlockPolicyEstimator` high-priority estimate range rose to **139**, or **18%** of Bitcoin Core transactions. `CBlockPolicyEstimator` assured that a transaction using **18 s/vb** would confirm within the next two blocks.

Two blocks passed, and transactions using that estimate were still not confirmed. `CBlockPolicyEstimator` remained at **18 s/vb**. At that time, the mempool-based fee estimator reduced its estimate to **22 s/vb**, while `CBlockPolicyEstimator` continued providing **18 s/vb**.

Block **812596** was mined a few minutes later.

<iframe width="600" height="371" seamless frameborder="0" scrolling="no" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQrOX3TK3AswjhfNfc9gOx93Z-ODDID2GQlapoW0YlwB_v4lkjx17_A-5CasONVr7kyhBne2x6qmXpm/pubchart?oid=1428828125&amp;format=interactive"></iframe>

The mempool contained only **0.5%** of fingerprinted Bitcoin Core transactions whose ancestor score was higher than the `CBlockPolicyEstimator` high-priority target fee rate.

Almost all Bitcoin Core transactions with higher fees than those suggested by `CBlockPolicyEstimator`, and which used different fee estimation sources, were mined.

<iframe width="600" height="371" seamless frameborder="0" scrolling="no" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQrOX3TK3AswjhfNfc9gOx93Z-ODDID2GQlapoW0YlwB_v4lkjx17_A-5CasONVr7kyhBne2x6qmXpm/pubchart?oid=470892768&amp;format=interactive"></iframe>

However, even after three blocks, there were still about **77** transactions stuck in the mempool. This is most likely due to the ancestor score of **18 s/vb**, which accounted for **14%** of the fingerprinted Bitcoin Core transactions.

During this period, `CBlockPolicyEstimator` began adjusting its estimate from **18 s/vb** to **20 s/vb**, due to the higher fee rates observed in mempool transactions that were confirmed.

### Why Fee Estimation Is Challenging

Estimating fees is challenging for several reasons. One major hurdle is unpredictable block confirmation times. Sometimes blocks are mined quickly, while at other times they can take over an hour.

When blocks are mined quickly, miners' mempools are cleared, resulting in a shallow mempool with lower–fee-rate transactions because higher–fee-rate transactions have already been mined. This reduces the fee rate required for a transaction to be included in the next block. If fee estimators do not consider the current state of the mempool, users may overpay.

Conversely, during congested periods with longer block confirmation times, failing to consider the state and size of the mempool can result in transactions becoming stuck due to underpayment.

Accounting for the state of the mempool is difficult because each user has a unique view of it, influenced by connectivity and policy rules. If a user's mempool is not well synchronized with miners' mempools, fee estimates may be biased.

For example, if a user's mempool mostly contains low–fee-rate transactions while miners primarily see high–fee-rate transactions, the user's transactions may get stuck due to insufficient fees. Conversely, if a user's mempool is dominated by high–fee-rate transactions while miners mostly see lower–fee-rate transactions, the user may overpay.

Failing to consider the current mempool state can lead to delayed or overpriced transactions, and mismatched mempool views further complicate accurate fee estimation.

#### Improvement Proposal

A mempool-based fee estimator is currently being proposed in Bitcoin Core. It will check whether nodes' mempools roughly align with the global mempool observed by miners. If a node’s mempool policy differs significantly from that of miners, `CBlockPolicyEstimator` should be used instead.

Until it is observed that a node has a mempool nearly identical to that of miners, a mempool-based fee estimator will not be reliable.

These are heuristics, and the proposal is still in its early stages. More insights and reviews are required to ensure the checks function as intended.

#### In Summary

Because of the constraints discussed above, no fee estimate can ever be completely accurate in predicting future events. If your transaction takes significantly longer to confirm than expected, don’t worry.

In most cases, you have two tools available: *replace-by-fee* and *CPFP*—the fee-bumping tag team. While the details of replace-by-fee and CPFP, along with scenarios where they may not rescue a stuck transaction, are beyond the scope of this article, they make for an interesting [read](https://gist.github.com/glozow/3de85d7e4fc58c5723f8fcbf21e5e795).

If a transaction overpaid, however—tough luck. There is no “undo” button. A valid transaction will remain valid and will eventually be picked up by a miner. Consider it your generous contribution to a miner’s retirement fund.

