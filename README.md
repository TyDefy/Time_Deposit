# Time Deposit

Time Deposits decentralised pool factory

Users deposit their ERC20 token into a smart contract which pools these tokens with other users (pools only contain one type of ERC20 token - starting with the most popular such as Dai and WETH). If a user then withdraws their tokens before a set time has elapsed, then they incur a penalty fee. This penalty fee is set asied into a pot which is then shared with people who did not withdraw their tokens. The longer you keep your tokens in for, the better since you will be eligible to receive more penalties from those who withdraw before you. The penalty is accrued based on the amount deposited through a simple weighted average.

The first pool will be called the HODL pool. HODL your WETH and be rewarded, don't HOLD and pay the penalty.

The user interface is simple and shows what the penalty is, the numebr of funds invested and the types of returns people have been earning in the fund. You can check out V1 here: 

http://timedeposit-staging.s3-website-us-east-1.amazonaws.com/
