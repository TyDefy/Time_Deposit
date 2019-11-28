pragma solidity 0.5.10;

import { IWithdraw } from "../interfaces/IWithdraw.sol";

contract CyclicWithdraw is IWithdraw {
    // TODO make interface for pool
    address internal pool_;
    // How long each user must wait to withdraw leggaly again.
    uint256 internal cycleLength_;
    // Withdraw control for pool
    bool internal violationWithdraw_;
    // struct of all user withdraw information
    struct UserInfo {
        uint256 lastDeposit;
        bool cantWithdrawInViolation;
    }
    // A mapping of all active suers
    mapping(address => UserInfo) internal users_;

    modifier onlyPool() {
        require(msg.sender == pool_, "Access denied, incorrect permissions");
        _;
    }

    constructor(
        address _pool,
        uint256 _cycleLength,
        bool _canWithdrawInViolation
    )
        public
    {
        // TODO cast to interface for pool
        pool_ = _pool;
        cycleLength_ = _cycleLength;
        // If true, a user can withdraw in violation, but pay a fee.
        // if false, a user cannot withdraw in violation.
        violationWithdraw_ = _canWithdrawInViolation;
    }

    function recordDeposit(uint256 _amount) onlyPool() public {
        _addUser(msg.sender, _amount, violationWithdraw_);
    }

    function getUserInfo(address _user) public view returns(uint256, bool) {
        return (
            users_[_user].lastDeposit,
            users_[_user].cantWithdrawInViolation
        );
    }

    function canWithdraw(
        address _user,
        uint256 _amount
    )
        public
        view
        returns(bool, uint256) 
    {
        // Checks if user is within penalty time
        if(users_[_user].lastDeposit + cycleLength_ >= now) {
            require(
                violationWithdraw_ &&
                users_[_user].cantWithdrawInViolation,
                "User cannot withdraw in violation"
            );
            
        } else {
            // If the user is not within their penalty time (i.e can withdraw
            // without penalty)
        }
    }

    function _addUser(
        address _user,
        uint256 _amount,
        bool _withdrawInViolation
    )
        internal
    {
        users_[_user].lastDeposit = now;
        users_[_user].cantWithdrawInViolation = _withdrawInViolation;
    }
}