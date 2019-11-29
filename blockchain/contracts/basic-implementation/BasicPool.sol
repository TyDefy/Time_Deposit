pragma solidity 0.5.10;

import { IWithdraw } from "../interfaces/IWithdraw.sol";
import { IERC20 } from "../interfaces/IERC20.sol";

contract BasicPool {
    address internal admin_;
    // Instance of the withdraw library 
    IWithdraw internal withdrawInstance_;
    // Instance of the collateral token (DAI) that this
    // Instance of the interest earning token (cDAI)
    IERC20 internal collateralInstance_;
    // struct of all user withdraw information
    struct UserInfo {
        uint256 balance;
        uint256 lastDeposit;
    }
    // A mapping of all active suers
    mapping(address => UserInfo) internal users_;

    modifier onlyAdmin() {
        require(
            msg.sender == admin_,
            "Access denided - incorrect permissions"
        );
        _;
    }

    constructor(
        address _admin,
        address _collateralToken
    )
        public
    {
        admin_ = _admin;
        collateralInstance_ = IERC20(_collateralToken);
    }

    /**
      * @notice Allows the admin to add the address of the withdraw
      *         library for this pool.
      * @param  _withdraw the address of the withdraw library
      */
    function init(
        address _withdraw
    )
        public
        onlyAdmin()
    {
        withdrawInstance_ = IWithdraw(_withdraw);
    }

    /**
      * @notice Allows a user to deposit raw collateral (DAI) into
      *         the contract, where it will then be converted into
      *         the interest earning asset (cDAI)
      * @param  _amount the amount of the raw token they  are depositng
      */
    function deposit(uint256 _amount) public {
        // TODO intergrate with token
        users_[msg.sender].balance += _amount;
        users_[msg.sender].lastDeposit = now;
    }

    function balanceOf(address _user) public view returns(uint256) {
        return users_[_user].balance;
    }

    function withdraw(uint256 _amount) public {
        require(
            users_[msg.sender].balance >= _amount,
            "Insufficent balance"
        );

        //TODO call withdraw library

        users_[msg.sender].balance -= _amount;
    }

    function getUserInfo(
        address _user
    )
        public
        view
        returns(
            uint256,
            uint256
        )
    {
        return (
            users_[_user].lastDeposit,
            users_[_user].balance
        );
    }
}