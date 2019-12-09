pragma solidity 0.5.10;

contract IWithdraw {

    /**
      * @notice Emitted when the withdraw function is called.
      */
    event withdrawCalculated(
        address indexed _user,
        uint256 _withdrawAmount,
        uint256 _penaltyAmount
    );

    /**
      * @notice Allows the pool (and user) to check if they are able to 
      *         wtihdraw. If the withdraw contract does not allow for 
      *         withdrawing inside of penalty, this function will return false
      *         inside penalty.
      * @param  _amount The amount the user wants to withdraw
	  * @param	_lastWithdraw The time stamp from the last withdraw
      * @return bool If the user can withdraw (false if they cannot)
      * @return uint256 If the user can withdraw, this is how much they will get
      *         _amount - penalty.
      * @return uint256 If the user can withdraw and there is a penalty, this is
      *         the penalty.
      */
    function canWithdraw(
        uint256 _amount,
		uint256 _lastWithdraw
    )
		public
		view
		returns(bool, uint256, uint256);

    /**
      * @notice Tells the pool how much a user can withdraw. Emits the 
      *         withdrawCalculated event.
      * @return uint256 The amount the user can withdraw
      * @return uint256 The amount of penalty (0 if there is non)
      * @return uint256 The timestamp of the last withdraw
      * @dev    This function will revert if a user cannot withdraw
      *         during the penalty. 
      */
    function calculateWithdraw(
        uint256 _amount,
        uint256 _lastWithdraw
    )
        public
		view
        returns(uint256, uint256);
}

// Withdraw function the pool can call

// Store a spcific withdraw paraiter & check realtive to each user or to entire pool for parameters

// If allowed to withdraw with a penalty despite false canWithdraw() check,
// then apply the penalty by calling the PenaltyContract.Penalise(uint256 _amount)

// Irraspective of passing failing checks above, (revert if 0 with reason)
// return withdraw vaule and penality vaule
