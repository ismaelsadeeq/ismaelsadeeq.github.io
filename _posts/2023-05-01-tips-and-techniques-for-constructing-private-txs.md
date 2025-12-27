---
layout: post
title: Tips and Techniques for Constructing Private Transactions with Privatetx library
date: 2023-05-01 16:40:16
description: How to construct Bitcoin Transactions that are mystery to chain analysis
tags: Privacy Bitcoin Transaction Chain-Analysis
categories: technical
---

### Introduction

The Bitcoin blockchain offers users the ability to conduct pseudonymous transactions, but privacy can easily be compromised with common missteps such as reusing addresses, improper coin selection and transaction construction.
Worse is taking full custody of users keys and subsequently attaching names or identity documents (KYC) to corresponding keys. As a result, chain analysis tools can easily identify individual users, trace the flow of bitcoins, 
and de-annonymize transactions. This has significant implications for the privacy and security of Bitcoin users. In this article, we will explore some steps that Bitcoin service builders can take to improve the privacy of their
users and minimize the impact of chain analysis tools. By implementing these steps, service providers can offer their users a more secure and private experience on the Bitcoin network, while helping to preserve the core values of Bitcoin 
as a decentralized and privacy-focused system.

### Keys Custody and identity documents (KYC)

Service providers should avoid taking full custody of their users private keys and should not associate users’ names or identity documents (KYC) with their Bitcoin addresses. Features such as output descriptors can give
users full control over their private keys while reducing service providers’ risks and responsibilities. By importing only the extended public key descriptor, users can recover their Bitcoin balance and transaction history
without providing identifying information and provide their private key only when signing a transaction. Although some jurisdictions may require collecting user information, service providers should avoid doing so as much 
as possible to protect their users’ privacy and the Bitcoin system as a whole.


If the above missteps are addressed, then it all comes down to how you construct your transaction. To enhance privacy, avoid reusing addresses when constructing transactions, and perform a coinjoin when aggregating inputs for 
a payment (combining multiple Bitcoin transactions into a single transaction) to break common input heuristics.

### [Privatetx-lib](http://github.com/ismaelsadeeq/privateTx)

Privatetx-lib is a library that checks partially signed bitcoin transactions (PSBTs) and provides alerts on whether the given PSBT is vulnerable to common chain analysis heuristics. 
These heuristics are what chain analysis services use to extract information from transactions, as mentioned in [research by OXT](https://medium.com/oxt-research/understanding-bitcoin-privacy-with-oxt-part-2-4-20010e0dab97) 
and the [Bitcoin privacy wiki](https://en.bitcoin.it/wiki/Privacy).

PSBT's are used as an input for privatetx-lib because finalized PSBTs contain information about transaction inputs, which enables the algorithm to check for these heuristics. This is unlike a serialized transaction that only 
provides the input’s transaction ID and output index. Additionally, PSBTs are the current standard used by Bitcoin applications. To learn more about PSBTs and how to use them in your application, refer to
[BIP 174](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki). These Heuristics are:

#### Transaction Wide Address reuse


<div class="row mt-3">
  <div class="col-sm-8">
    <img class="img-fluid rounded z-depth-1" src="/assets/img/privatetx/fig1.png" alt="Figure 1">
  </div>
</div>

<br>

In the above diagram, the change address of the transaction is the same as the input address. This is bad for privacy because it reveals the owner of the address bc1qzjdnhtrplk32vecxfqz8hmmf3mnenvecmvwhhy as
the one who paid 10 bitcoins to the address bc1qaekdm6unw8qr6f5gwg48vfjntqf0xj9zpldwl5 and received 4.8 bitcoins as change. This information can be used to link the owner of the input address with the owner of the output address.

The best practice is to use a new address in the change output.

<br>

<div class="row mt-3">
  <div class="col-sm-8">
    <img class="img-fluid rounded z-depth-1" src="/assets/img/privatetx/fig2.png" alt="Figure 2">
  </div>
</div>

<br>

This approach provides less certainty to an observer in the network about the nature of the outputs. By using a new address for the change output, it becomes less clear whether both outputs are payments or if one of them is a change.

Call the private-tx checkAddressReuse function with your PSBT string and ensure that it passes the address reuse heuristic.

#### Common Inputs

If it’s an aggregation transaction, this heuristic will detect that the inputs are consolidated by one wallet for a payment.

<br>

<div class="row mt-3">
  <div class="col-sm-8">
    <img class="img-fluid rounded z-depth-1" src="/assets/img/privatetx/fig3.png" alt="Figure 1">
  </div>
</div>

<br>

This transaction in the diagram above clearly indicates that the two inputs of 15 and 25 bitcoins were consolidated in order to perform the 35 bitcoin payment. The change output is likely to be the 4.8 bitcoin output.


<br>

<div class="row mt-3">
  <div class="col-sm-8">
    <img class="img-fluid rounded z-depth-1" src="/assets/img/privatetx/fig4.png" alt="Figure 4">
  </div>
</div>

<br>

A common way to break the address reuse heuristic is to combine it with another transaction, commonly known as coinjoin, which helps to obscure the connection between the inputs and outputs of a transaction and make it
difficult to determine whether they belong to the same user.



<br>

<div class="row mt-3">
  <div class="col-sm-8">
    <img class="img-fluid rounded z-depth-1" src="/assets/img/privatetx/fig5.png" alt="Figure 5">
  </div>
</div>

<br>

In this newly constructed transaction with multiple inputs and payments, it will be difficult for an observer to distinguish between the payment outputs and the change output.

#### Check against change detection

When it’s a distributing transaction, change outputs will be detected. To break the heuristic, you can perform coinjoin, change the script type to match the payment and avoid reusing addresses.
It depends on the reason why the change was detected. Private-tx provides information on why change outputs were detected, such as address reuse being a change output, a different output script type indicating a payment,
an output value greater than all input values being the payment output, non-round number outputs being change outputs, and the largest output value being the change output.

Example of output with a different script type with the input.

<br>

<div class="row mt-3">
  <div class="col-sm-8">
    <img class="img-fluid rounded z-depth-1" src="/assets/img/privatetx/fig6.png" alt="Figure 6">
  </div>
</div>

<br>

The 1 bitcoin output above is a P2SH, which clearly shows that it is the payment output, and the 0.99999 bitcoin output is the change output.


<br>

<div class="row mt-3">
  <div class="col-sm-8">
    <img class="img-fluid rounded z-depth-1" src="/assets/img/privatetx/fig7.png" alt="Figure 7">
  </div>
</div>

<br>

To break these heuristics, change the change output address to P2SH.


<br>

<div class="row mt-3">
  <div class="col-sm-8">
    <img class="img-fluid rounded z-depth-1" src="/assets/img/privatetx/fig8.png" alt="Figure 8">
  </div>
</div>

<br>

An observer of this transaction can not distinguish whether it is the payment or the change output.

#### Peeling transaction

It is common that exchanges make settlements in a peeling transaction format below.


<br>

<div class="row mt-3">
  <div class="col-sm-8">
    <img class="img-fluid rounded z-depth-1" src="/assets/img/privatetx/fig9.png" alt="Figure 9">
  </div>
</div>

<br>

The 19.44444 bitcoin is clearly the change output, whereas 0.5 bitcoin is a payment.


<br>

<div class="row mt-3">
  <div class="col-sm-8">
    <img class="img-fluid rounded z-depth-1" src="/assets/img/privatetx/fig10.png" alt="Figure 10">
  </div>
</div>

<br>

To break the peeling transaction heuristic, it is recommended for exchange builders to avoid peeling the transaction and improve the privacy of their transactions. 
Peeling transactions often occur due to the reuse of addresses and the accumulation of large amounts of bitcoin in a single address, resulting in a large value input that needs to be peeled off to settle a customer.
Instead, it is suggested to avoid reusing addresses and have a low value output that can be used to settle a customer. By doing this, exchange builders can ensure the privacy of their transactions and avoid the detection of the peeling heuristic.

You can use Private-tx to check whether a transaction is a peeling transaction or not.

Check https://github.com/ismaelsadeeq/privateTx to learn how to install and use privatetx-lib, it is a JavaScript library and services that are based on TypeScript or JavaScript can leverage on privatetx-lib to improve how they construct their
transaction and ensure they are resilient to chain analysis tools.

Chain analysis tools use heuristics to analyze the Bitcoin blockchain transaction by transaction. These heuristics cluster wallets, predict their unspent balance, and track their payment history. The tools determine the
change and payment outputs in a transaction and link the spending transaction of the change output to previous transactions. By checking for the reuse of the input or change output address, the tools create a graph of clusters of wallets
and their payments over time, along with the remaining balance currently held.


<br>

<div class="row mt-3">
  <div class="col-sm-8">
    <img class="img-fluid rounded z-depth-1" src="/assets/img/privatetx/fig11.png" alt="Figure 11">
  </div>
</div>

_Image By Gaurav Agrawal Coinpath August 15, 2020_

<br>

However, this data alone is not enough to identify the real-world identities behind these wallets. That’s where collaboration with exchanges and wallets that require personal identifiable information comes into play.
With this collaboration, chain analysis tools can link real identities with payments or wallets, potentially compromising the privacy of users.


<br>

<div class="row mt-3">
  <div class="col-sm-8">
    <img class="img-fluid rounded z-depth-1" src="/assets/img/privatetx/fig12.png" alt="Figure 12">
  </div>
</div>

<br>

The above example in the diagram illustrates how the identity of a Bitcoin user was revealed due to privacy missteps by their wallet.
This demonstrates how a compromise of privacy not only affects the victim, but also the people with whom they transact.

### Conclusion

Protecting user privacy is essential in preserving the core values of Bitcoin as a decentralized and privacy-focused system. 
Bitcoin service builders should take several steps to minimize the impact of chain analysis tools on their users by using of tools like privatetx-lib, which can help service providers improve how they construct their transactions.
By implementing these steps, Bitcoin service providers can offer their users a more secure and private experience on the Bitcoin network, while protecting their privacy and maintaining their reputation as a privacy-focused service.
