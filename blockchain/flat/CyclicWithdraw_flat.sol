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


/**
  * @author Veronica Coutts @VeronicaLC (gitlab)
  * @title  IPenalty
  * @notice This defines the interfacce for the penalty library, to allow for
  *         flexible cominations and intergrations of the functionality.
  */
contract IPenalty {

    /**
      * @notice Emitted when the penalize function is called.
      */
    event penaltyCalculated(
        uint256 _origionalAmount,
        uint256 _newAmount,
        uint256 _penalty
    );

    /**
      * @notice Works out the amount of penalty to take of the provided amount.
      * @param  _amount The amount to remove the penalty from
      * @return uint256 The amount the user will recive
      * @return uint256 The penalty amount 
      * @dev    This function does not check if the penality applies, it only
      *         applies it. It is the withdraw library that checks if the
      *         penality applies.
      */
    function penalize(uint256 _amount) public view returns(uint256, uint256);
}

// has a function called calculate penality takes in amounts, returns penalty amount and how
// much the person can withdraw. 
// One penity library can manage one penality type (a specific %)
// can only be called by its one withdraw library 


contract CyclicWithdraw is IWithdraw {
    // How long each user must wait to withdraw leggaly again.
    uint256 internal cycleLength_;
    // Withdraw control for pool
    bool internal violationWithdraw_;
    //
    IPenalty internal penaltyInstance_;

    constructor(
        address _penalty,
        uint256 _cycleLength,
        bool _canWithdrawInViolation
    )
        public
    {
        penaltyInstance_ = IPenalty(_penalty);
        cycleLength_ = _cycleLength;
        // If true, a user can withdraw in violation, but pay a fee.
        // if false, a user cannot withdraw in violation.
        violationWithdraw_ = _canWithdrawInViolation;
    }

    function canWithdraw(
        uint256 _amount,
        uint256 _lastWithdraw
    )
        public 
        view
        returns(bool, uint256, uint256) 
    {
        if(_lastWithdraw + cycleLength_ > now) {
            if(violationWithdraw_) {
                uint256 penalty = 0;
                uint256 withdraw = _amount;
                (withdraw, penalty) = penaltyInstance_.penalize(_amount);
                return (true, withdraw, penalty);
            } else {
                return (false, 0, 0);
            }
        } else {
            return (true, _amount, 0);
        }
    } 

    function calculateWithdraw(
        uint256 _amount,
        uint256 _lastWithdraw
    )
        public
        view
        returns(uint256, uint256) 
    {
        // Checks if user is within penalty time
        if(_lastWithdraw + cycleLength_ < now) {
            // User is within penalty time
            require(
                violationWithdraw_,
                "User cannot withdraw in violation"
            );
            uint256 penalty;
            uint256 withdraw;
            (withdraw, penalty) = penaltyInstance_.penalize(_amount);
            return (withdraw, penalty);
        } else {
            // If the user is not within their penalty time (i.e can withdraw
            // without penalty)
            return (_amount, 0);
        }
    }

    function cantWithdrawInViolation() public view returns(bool) {
        return violationWithdraw_;
    }

    function getCycle() public view returns(uint256) {
        return cycleLength_;
    } 
}