pragma solidity 0.5.10;

import { IWithdraw } from "../interfaces/IWithdraw.sol";
import { IPenalty } from "../interfaces/IPenalty.sol";

contract RollingWithdraw is IWithdraw {
    // Withdraw control for pool
    bool internal violationWithdraw_;
    // Instance of penalty contract
    IPenalty internal penaltyInstance_;
    // A switch that can block the withdrawing of interest
    bool internal interestViolationWithdraw_;

    /**
      * @notice Cycle length will be ignored
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
        violationWithdraw_ = _canWithdrawInViolation;
        interestViolationWithdraw_ = _canWithdrawInterestInViolation;
    }

    function canWithdrawInterest(uint256 _lastWithdraw) public view returns(bool) {
        return interestViolationWithdraw_;
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

    function cantWithdrawInterestInViolation() public view returns(bool) {
        return interestViolationWithdraw_;
    }

    function getCycle() public view returns(uint8) {
        return 0;
    } 

    function getPenalty() public view returns(address) {
        return address(penaltyInstance_);
    }
}