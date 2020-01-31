pragma solidity 0.5.10;

import { IWithdraw } from "../interfaces/IWithdraw.sol";
import { IPenalty } from "../interfaces/IPenalty.sol";

contract CyclicWithdraw is IWithdraw {
    // How long each user must wait to withdraw legally again.
    uint8 internal cycleLength_;
    // Withdraw control for pool
    bool internal canWithdrawInViolation_;
    // Instance of penalty contract
    IPenalty internal penaltyInstance_;
    // A switch that can block the withdrawing of interest
    bool internal canWithdrawInterestInViolation_;

    constructor(
        address _penalty,
        uint8 _cycleLength,
        bool _canWithdrawInViolation,
        bool _canWithdrawInterestInViolation
    )
        public
    {
        penaltyInstance_ = IPenalty(_penalty);
        cycleLength_ = _cycleLength;
        // If true, a user can withdraw in violation, but pay a fee.
        // if false, a user cannot withdraw in violation.
        canWithdrawInViolation_ = _canWithdrawInViolation;
        canWithdrawInterestInViolation_ = _canWithdrawInterestInViolation;
    }

    function canWithdrawInterest(uint256 _lastWithdraw) public view returns(bool) {
        if(!canWithdrawInterestInViolation_) {
            if(_lastWithdraw + cycleLength_ > now) {
                return false;
            } 
        } else {
            return true;
        }
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

    function cantWithdrawInViolation() public view returns(bool) {
        return canWithdrawInViolation_;
    }

    function cantWithdrawInterestInViolation() public view returns(bool) {
        return canWithdrawInterestInViolation_;
    }

    function getCycle() public view returns(uint8) {
        return cycleLength_;
    } 

    function getPenalty() public view returns(address) {
        return address(penaltyInstance_);
    }
}