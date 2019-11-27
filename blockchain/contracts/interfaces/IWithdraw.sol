// Withdraw function the pool can call

// Store a spcific withdraw paraiter & check realtive to each user or to entire pool for parameters

// If allowed to withdraw with a penalty despite false canWithdraw() check,
// then apply the penalty by calling the PenaltyContract.Penalise(uint256 _amount)

// Irraspective of passing failing checks above, (revert if 0 with reason)
// return withdraw vaule and penality vaule