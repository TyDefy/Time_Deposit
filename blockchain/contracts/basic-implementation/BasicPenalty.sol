pragma solidity 0.5.10;

import { IPenalty } from "../interfaces/IPenalty.sol";

/**
  * @author Veronica Coutts @veronicaLC
  * @title  Basic penalty library
  * @notice This contract us a utility that is used by the baisc pool
  */
contract BasicPenalty is IPenalty {
    uint8 internal penalty_;
    constructor(uint8 _penaltyPercentage) public {
        penalty_ = _penaltyPercentage;
    }

    /**
      * @notice Works out the amount of penalty to take of the provided amount.
      * @param  _amount The amount to remove the penalty from
      * @return uint256 The amount the user will recive
      * @return uint256 The penalty amount 
      * @dev    This function does not check if the penality applies, it only
      *         applies it. It is the withdraw library that checks if the
      *         penality applies.
      * @dev    Here is where a variable penalty would be implemented 
      */
    function penalize(uint256 _amount) public view returns(uint256, uint256) {
        uint256 penalty = (_amount*penalty_)/100;
        return (_amount - penalty, penalty);
    }

    /**
      * @return uint8 The penalty percentage as a whole number
      */
    function penalty() public view returns(uint8) {
        return penalty_;
    }
}