pragma solidity 0.5.10;

import { IWithdraw } from "../interfaces/IWithdraw.sol";
import { IPenalty } from "../interfaces/IPenalty.sol";

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
        // if(_lastWithdraw + cycleLength_ < now) {
        //     if(violationWithdraw_) {
        //         uint256 penalty = 0;
        //         uint256 withdraw = _amount;
        //         // (withdraw, penalty) = penaltyInstance_.penalize(_amount);
        //         return (true, withdraw, penalty);
        //     } else {
        //         return (false, 0, 0);
        //     }
        // } else {
            return (true, _amount, 0);
        // }
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