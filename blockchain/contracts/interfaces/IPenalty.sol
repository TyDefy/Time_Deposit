pragma solidity 0.5.10;

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

    /**
      * @return uint8 The penalty percentage as a whole number
      */
    function penalty() public view returns(uint8);
}