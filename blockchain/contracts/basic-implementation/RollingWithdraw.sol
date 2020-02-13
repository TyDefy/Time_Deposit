pragma solidity 0.5.10;

import { IWithdraw } from "../interfaces/IWithdraw.sol";
import { IPenalty } from "../interfaces/IPenalty.sol";

/**
  * @author Veronica Coutts @veronicaLC
  * @title  Cyclic withdraw library
  * @notice The rolling withdraw library is a utility to the basic pool. 
  */
contract RollingWithdraw is IWithdraw {
    // Withdraw control for pool
    bool internal violationWithdraw_;
    // Instance of penalty contract
    IPenalty internal penaltyInstance_;
    // A switch that can block the withdrawing of interest
    bool internal interestViolationWithdraw_;

     /**
      * @param  _penalty The peanlty library address
      * @param  _cycleLength Ignored in this contract
      * @param  _canWithdrawInViolation Ignored in this contract
      * @param  _canWithdrawInterestInViolation Ignored in this contract
      */
    constructor(
        address _penalty,
        uint8 _cycleLength,
        bool _canWithdrawInViolation,
        bool _canWithdrawInterestInViolation
    )
        public
    {
        penaltyInstance_ = IPenalty(_penalty);
        // If true, a user can withdraw in violation, but pay a fee.
        // if false, a user cannot withdraw in violation.
        violationWithdraw_ = true;
        interestViolationWithdraw_ = true;
    }

    /**
      * @param  _lastWithdraw The time stamp of the last withdraw
      * @return bool If the user can withdraw or not
      */
    function canWithdrawInterest(
        uint256 _lastWithdraw
    ) 
        public 
        view 
        returns(bool) 
    {
        return interestViolationWithdraw_;
    }

    /**
      * @param  _amount The amount the user would like to withdraw
      * @param  _lastWithdraw The time stamp of the users last withdraw
      * @return bool If the user can withdraw
      * @return uint256 The withdraw amount (if there is no penalty this amount
      *         will be the full amount the user wanted to withdraw)
      * @return uint256 The penalty amount (if no peanlty is applied this will 
      *         be 0)
      */
    function canWithdraw(
        uint256 _amount,
        uint256 _lastWithdraw
    )
        public 
        view
        returns(bool, uint256, uint256) 
    {
        uint256 penalty = 0;
        uint256 withdraw = _amount;
        (withdraw, penalty) = penaltyInstance_.penalize(_amount);
        return (true, withdraw, penalty);
    }

     /**
      * @notice This function will not revert, as the user will never be in 
      *         violation
      * @param  _amount The amount the user would like to withdraw
      * @param  _lastWithdraw The time stamp of the users last withdraw
      * @return uint256 The withdraw amount (if there is no penalty this amount
      *         will be the full amount the user wanted to withdraw)
      * @return uint256 The penalty amount (if no peanlty is applied this will 
      *         be 0)
      */
    function calculateWithdraw(
        uint256 _amount,
        uint256 _lastWithdraw
    )
        public
        view
        returns(uint256, uint256) 
    {
        // User is within penalty time
        require(
            violationWithdraw_,
            "User cannot withdraw in violation"
        );
        uint256 penalty;
        uint256 withdraw;
        (withdraw, penalty) = penaltyInstance_.penalize(_amount);
        return (withdraw, penalty);
    }

    /**
      * @return bool If users can withdraw in voilation of the cycle
      */
    function canWithdrawInViolation() public view returns(bool) {
        return violationWithdraw_;
    }

    /**
      * @return bool If users can withdraw interest in violation of the cycle
      */
    function canWithdrawInterestInViolation() public view returns(bool) {
        return interestViolationWithdraw_;
    }

    /**
      * @return uint8 The cycle lenght of the cycle
      */
    function getCycle() public view returns(uint8) {
        return 0;
    } 

    /**
      * @return address The address of the penalty contract
      */
    function getPenalty() public view returns(address) {
        return address(penaltyInstance_);
    }
}