pragma solidity 0.5.10;

import { IWithdraw } from "../interfaces/IWithdraw.sol";
import { IPenalty } from "../interfaces/IPenalty.sol";

contract CyclicWithdraw is IWithdraw {
    // How long each user must wait to withdraw leggaly again.
    uint256 internal cycleLength_;
    // Withdraw control for pool
    bool internal violationWithdraw_;
    // Instance of penalty contract
    IPenalty internal penaltyInstance_;

    /**
      * @notice Cycle length will be ignored
      */
    constructor(
        address _penalty,
        uint256 _cycleLength,
        bool _canWithdrawInViolation
    )
        public
    {
        penaltyInstance_ = IPenalty(_penalty);
        cycleLength_ = 0;
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
        uint256 penalty = 0;
        uint256 withdraw = _amount;
        (withdraw, penalty) = penaltyInstance_.penalize(_amount);
        return (true, withdraw, penalty);
    }

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

    function cantWithdrawInViolation() public view returns(bool) {
        return violationWithdraw_;
    }

    function getCycle() public view returns(uint256) {
        return cycleLength_;
    } 

    function getPenalty() public view returns(address) {
        return address(penaltyInstance_);
    }
}