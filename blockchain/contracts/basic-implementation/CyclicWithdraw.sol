pragma solidity 0.5.10;

import { IWithdraw } from "../interfaces/IWithdraw.sol";
import { IPenalty } from "../interfaces/IPenalty.sol";
import { BokkyPooBahsDateTimeLibrary } from "../BokkyPooBahsDateTimeLibrary.sol";

/**
  * @author Veronica Coutts @veronicaLC
  * @title  Cyclic withdraw library
  * @notice The cyclic withdraw library is a utility to the basic pool. 
  */
contract CyclicWithdraw is IWithdraw {
    // How long each user must wait to withdraw legally again.
    uint256 internal cycleLength_;
    // The cycle lenght in months
    uint8 internal cycleLenghtInMonths_;
    // Withdraw control for pool
    bool internal canWithdrawInViolation_;
    // Instance of penalty contract
    IPenalty internal penaltyInstance_;
    // A switch that can block the withdrawing of interest
    bool internal canWithdrawInterestInViolation_;

    using BokkyPooBahsDateTimeLibrary for uint256;

    /**
      * @param  _penalty The peanlty library address
      * @param  _cycleLength The length for the cycle in months
      * @param  _canWithdrawInViolation If the user can withdraw in violation
      *         of the cycle
      * @param  _canWithdrawInterestInViolation If the user can wtihdraw 
      *         interest in vionlation of the cycle
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
        cycleLenghtInMonths_ = _cycleLength;
        cycleLength_ = cycleLength_.addMonths(_cycleLength);
        // If true, a user can withdraw in violation, but pay a fee.
        // if false, a user cannot withdraw in violation.
        canWithdrawInViolation_ = _canWithdrawInViolation;
        canWithdrawInterestInViolation_ = _canWithdrawInterestInViolation;
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
        if(!canWithdrawInterestInViolation_) {
            if(_lastWithdraw + cycleLength_ > now) {
                return false;
            } 
        } else {
            return true;
        }
    }

    /**
      * @param  _amount The amount the user would like to withdraw
      * @param  _lastWithdraw The time stamp of the users last withdraw
      * @return bool If the user can withdraw in violation at all
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
        if(_lastWithdraw + cycleLength_ > now) {
            if(canWithdrawInViolation_) {
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

    /**
      * @notice This function will revert if the user cannot withdraw in 
      *         voliation and the user is still within the violation period
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
        // Checks if user is within penalty time
        if(_lastWithdraw + cycleLength_ < now) {
            // User is within penalty time
            require(
                canWithdrawInViolation_,
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

    /**
      * @return bool If users can withdraw in voilation of the cycle
      */
    function canWithdrawInViolation() public view returns(bool) {
        return canWithdrawInViolation_;
    }

    /**
      * @return bool If users can withdraw interest in violation of the cycle
      */
    function canWithdrawInterestInViolation() public view returns(bool) {
        return canWithdrawInterestInViolation_;
    }

    /**
      * @return uint8 The cycle lenght of the cycle
      */
    function getCycle() public view returns(uint8) {
        return cycleLenghtInMonths_;
    } 

    /**
      * @return address The address of the penalty contract
      */
    function getPenalty() public view returns(address) {
        return address(penaltyInstance_);
    }
}