pragma solidity 0.5.10;

import { IWithdraw } from "../interfaces/IWithdraw.sol";
import { IERC20 } from "../interfaces/IERC20.sol";

contract BasicPool {
    address internal admin_;
    // Instance of the withdraw library 
    IWithdraw internal withdrawInstance_;
    // Instance of the collateral token (DAI) that this
    // contract will recive in deposit
    IERC20 internal receivingColalteralInstance_;
    // Instance of the interest earning token (cDAI)
    IERC20 internal collateralInstance_;

    modifier onlyAdmin() {
        require(
            msg.sender == admin_,
            "Access denided - incorrect permissions"
        );
        _;
    }

    constructor(
        address _admin,
        address _basicCollateralToken,
        address _interestEarningCollateralToken
    )
        public
    {
        admin_ = _admin;
        receivingColalteralInstance_ = IERC20(_basicCollateralToken);
        collateralInstance_ = IERC20(_interestEarningCollateralToken);
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
        // Ensures the user has approved this pool as a spender
        require(
            receivingColalteralInstance_.allowance(
                msg.sender,
                address(this)
            ) >= _amount,
            "Pool has not been approved as a spender"
        );


    }
}