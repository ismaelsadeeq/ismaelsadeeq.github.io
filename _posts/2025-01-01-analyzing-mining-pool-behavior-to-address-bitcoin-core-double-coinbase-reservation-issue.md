---
layout: post
title: "Analyzing Mining Pool Behavior to Address Bitcoin Core’s Double Coinbase Reservation Issue"
date: 2025-01-01
description: Analysis of mining pool behavior regarding Bitcoin Core’s double coinbase reservation bug and its impact on block template weights.
tags:
  - bitcoin
  - mining
  - analysis
  - block-template
categories: "technical analysis"
---

In theory, Bitcoin Core's block-building algorithm reserves **4000 WU** for block header, transaction count and miners' coinbase transactions.  
This means it should generate a block template with a weight of **3,996,000 WU**.  
However, in practice, this is not the case due to an accidental double-reservation bug ([see #21950](https://github.com/bitcoin/bitcoin/issues/21950)).  
As a result, Bitcoin Core generates block templates with a weight of **3,992,000 WU**.  

There is an ongoing attempt to fix this issue ([see #31384](https://github.com/bitcoin/bitcoin/pull/31384)), but there are [concerns](https://github.com/bitcoin/bitcoin/pull/31384#pullrequestreview-2489253785) that fixing the issue could lead to some miners generating invalid block templates.  
If the PR were to be merged, mining pools using the updated Bitcoin Core version must ensure the sum of the coinbase transaction weight and the weight of all additional transactions added to the block template must not exceed **4000 WU**.  
Otherwise, the block will exceed the consensus limit for the maximum block weight (**4,000,000 WU**) and be invalid.

The proposed PR fixes the double reservation issue, increasing the block template size by **4000 WU**, resulting in blocks with a weight of **3,996,000 WU** as expected.

Miners or pools needing more than **4000 WU** for their coinbase transactions should configure `bitcoind` with a lower `-blockmaxweight` option.  
Example: `-blockmaxweight=3999000` frees up an additional **1000 WU**.

**Blocks Analyzed:** 107,313  
**Period:** 24th December 2022 to 23rd December 2024

### Methodology

- Used [libbitcoinkernel](https://github.com/stickies-v/py-bitcoinkernel/) to read blocks from disk.  
- Each block deserialized; [bitcoin-data/mining-pools](https://github.com/bitcoin-data/mining-pools) tags used to match the block to a mining pool. Block weight, coinbase transaction, and mining pool info saved to disk.  
- Analysis generated using [this script](https://github.com/ismaelsadeeq/mining-analysis?tab=readme-ov-file#3-generate_resultspy).  
- Charts generated using [these scripts](https://github.com/ismaelsadeeq/mining-analysis?tab=readme-ov-file#4-graph-generation-scripts).  
- More methodology details: [GitHub - mining-analysis](https://github.com/ismaelsadeeq/mining-analysis).

---

### Pools Generating Blocks with Coinbase Weight > 4000 WU

|Pool Name | Average Coinbase weight  | Lowest Coinbase weight | Highest coinbase weight |
|--- | --- | --- | --- |
|Ocean.xyz | 6994 | 5308 (865820) | 9272 (863471) |
|Unknown pool | 7432 | 7000 (824116) | 7864 (785117) |

<div class="row mt-4">
  <div class="col-md-9">
    <figure>
      <img class="img-fluid rounded z-depth-1"
           src="{{ site.baseurl }}/assets/img/mining-analysis/fig1.png"
           alt="Large Coinbase Transaction Weights">
      <figcaption class="mt-2 text-muted">
        Distribution of coinbase transaction weights for pools generating blocks with coinbase weights &gt; 4000 WU.
      </figcaption>
    </figure>
  </div>
</div>

---

### Remaining Mining Pools Coinbase Stats

|Pool Name|Average Coinbase Weight|Lowest Coinbase Weight|Highest Coinbase Weight|
|---------|---------------------|---------------------|---------------------|
|ViaBTC|1,128|864 (778363)|1,284 (868424)|
|Foundry USA|834|748 (833764)|1,192 (868391)|
|F2Pool|1,610|1,176 (787112)|1,832 (868388)|
|AntPool|1,357|732 (814783)|1,612 (875136)|
|Binance Pool|1,151|684 (789485)|1,480 (810101)|
|SpiderPool|997|704 (817123)|1,296 (863176)|
|Braiins Pool|1,056|684 (853433)|1,232 (785389)|
|MARA Pool|815|720 (800883)|1,016 (833308)|
|SecPool|1,371|1,088 (808120)|1,460 (871380)|
|Poolin|1,110|728 (852695)|1,336 (795979)|
|Luxor|1,237|780 (770527)|1,480 (868404)|
|BTC.com|1,205|740 (796334)|1,476 (811469)|
|Pega Pool|688|688 (800892)|688 (800892)|
|Ultimus Pool|1,209|1,056 (853449)|1,444 (844214)|
|EMCDPool|1,082|1,080 (804771)|1,304 (795962)|
|SBI Crypto|716|716 (833247)|716 (833247)|
|NiceHash|786|780 (804872)|828 (870207)|
|Titan|696|696 (770484)|696 (770484)|
|WhitePool|887|676 (820630)|1,304 (865060)|
|KuCoin Pool|1,095|1,092 (777136)|1,316 (796122)|
|CleanIncentive|728|728 (819134)|728 (819134)|
|1THash|1,084|1,084 (837937)|1,088 (864350)|
|EclipseMC|860|860 (858559)|860 (858559)|
|Terra Pool|844|844 (780190)|844 (780190)|
|CKPool|856|856 (863890)|856 (863890)|

<div class="row mt-4">
  <div class="col-md-9">
    <figure>
      <img class="img-fluid rounded z-depth-1"
           src="{{ site.baseurl }}/assets/img/mining-analysis/fig2.png"
           alt="Line Chart of Coinbase Transaction Weights">
      <figcaption class="mt-2 text-muted">
        Average, minimum, and maximum coinbase transaction weights for various mining pools.
      </figcaption>
    </figure>
  </div>
</div>

---

### Pools with Blocks (> 3,996,000 WU)

| Pool Name | Average Block Weight | Lowest Block Weight | Highest Block Weight |
| --- | --- | --- | --- |
| F2Pool | 3,997,857 | 3,994,044 (828959) | 3,998,554 (779729) |

### Pools with Blocks (< 3,996,000 WU)

| Pool Name | Average Block Weight | Lowest Block Weight | Highest Block Weight |
| --- | --- | --- | --- |
| Foundry USA    | 3,993,030 | 3,992,749 (813879) | 3,993,523 (874770) |
| Binance Pool   | 3,993,348 | 3,992,753 (784937) | 3,993,768 (846996) |
| MARA Pool      | 3,993,017 | 3,992,721 (802653) | 3,994,944 (859968) |
| Luxor          | 3,993,434 | 3,992,782 (768718) | 3,993,811 (841510) |
| AntPool        | 3,993,554 | 3,992,868 (814783) | 3,993,918 (873367) |
| ViaBTC         | 3,993,324 | 3,992,881 (782955) | 3,993,612 (872513) |
| Poolin         | 3,993,308 | 3,992,987 (855538) | 3,993,613 (795979) |
| Braiins Pool   | 3,993,251 | 3,992,695 (853433) | 3,993,416 (853776) |
| SBI Crypto     | 3,992,911 | 3,992,717 (796840) | 3,993,047 (834797) |
| Ultimus Pool   | 3,993,407 | 3,993,076 (852748) | 3,993,768 (842345) |
| BTC.com        | 3,993,399 | 3,992,745 (796409) | 3,993,781 (806063) |
| SpiderPool     | 3,993,190 | 3,992,912 (856599) | 3,993,616 (864899) |
| WhitePool      | 3,993,072 | 3,992,677 (825268) | 3,993,631 (872281) |
| Ocean.xyz      | 3,988,137 | 3,986,489 (865820) | 3,990,301 (863471) |
| EMCDPool       | 3,993,273 | 3,993,081 (781934) | 3,993,428 (796046) |
| Pega Pool      | 3,992,894 | 3,992,690 (783729) | 3,993,018 (781576) |
| Titan          | 3,992,974 | 3,992,926 (768641) | 3,993,020 (769939) |
| KuCoin Pool    | 3,993,282 | 3,993,101 (781030) | 3,993,504 (796188) |
| Terra Pool     | 3,993,032 | 3,992,863 (776927) | 3,993,172 (780396) |
| CleanIncentive | 3,992,946 | 3,992,748 (823029) | 3,993,038 (822604) |
| 1THash         | 3,993,276 | 3,993,085 (837937) | 3,993,412 (814830) |
| NiceHash       | 3,992,987 | 3,992,782 (789503) | 3,993,148 (785085) |
| CKPool         | 3,993,102 | 3,992,897 (863890) | 3,993,181 (822636) |

<div class="row mt-4">
  <div class="col-md-9">
    <figure>
      <img class="img-fluid rounded z-depth-1"
           src="{{ site.baseurl }}/assets/img/mining-analysis/fig3.png"
           alt="Block Weights for Pools">
      <figcaption class="mt-2 text-muted">
        Average, minimum, and maximum block weights for various mining pools.
      </figcaption>
    </figure>
  </div>
</div>

---

### Key Observations

- Most mining pools adhere to Bitcoin Core’s default setup, keeping coinbase transaction weights well below **4000 WU**. Two pools stand out:
  - **Ocean.xyz**: Avg coinbase **6,994 WU**, min **5,308 WU**, max **9,272 WU**, avg block weight **3,986,489 WU**. Likely uses reduced `-blockmaxweight`.  
  - **Unknown Pool**: Avg coinbase **7,432 WU**, max **7,864 WU**, very low block weight—unusual.
- **F2Pool**: Avg block **3,997,857 WU**, e.g., block **779729** reached **3,998,554 WU** with coinbase **1,588 WU**, showing efficient block use.
- Majority of pools (Foundry USA, Binance Pool, AntPool) produce blocks ~**3,993,000 WU**, showing underutilization due to double-reservation bug.
- Small increase in block weights accounted for by block headers ([see @0xB10C](https://delvingbitcoin.org/t/analyzing-mining-pool-behavior-to-address-bitcoin-cores-double-coinbase-reservation-issue/1351/4?u=ismaelsadeeq)).

Fixing double-reservation increases block templates to **3,996,000 WU**, allowing full block weight utilization while preserving **4000 WU** for coinbase and other additions.

Miners needing extra space (like Ocean.xyz) can set `-blockmaxweight=3999000` to free **1000 WU** for larger coinbase transactions, ensuring consensus compliance.

