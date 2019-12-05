pragma solidity 0.5.10;

import { IWithdraw } from "../interfaces/IWithdraw.sol";
import { IERC20 } from "../interfaces/IERC20.sol";
import { ICToken } from "../interfaces/ICToken.sol";

contract BasicPool {
    address internal admin_;
    // Instance of the withdraw library 
    IWithdraw internal withdrawInstance_;
    // Instance of the collateral token (DAI) that this
    IERC20 internal collateralInstance_;
    // Instance of the interest earning token (cDAI)
    ICToken internal cTokenInstance_;
    // struct of all user withdraw information
    struct UserInfo {
        uint256 collateralInvested;
        uint256 balance;
        uint256 lastDeposit;
        uint256 lastWtihdraw;
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
        address _withdraw,
        address _collateralToken,
        address _cToken
    )
        public
    {
        admin_ = _admin;
        withdrawInstance_ = IWithdraw(_withdraw);
        collateralInstance_ = IERC20(_collateralToken);
        cTokenInstance_ = ICToken(_cToken);
    }

    /**
      * @notice Allows a user to deposit raw collateral (DAI) into
      *         the contract, where it will then be converted into
      *         the interest earning asset (cDAI)
      * @param  _amount the amount of the raw token they  are depositng
      */
    function deposit(uint256 _amount) public {
        require(
            collateralInstance_.allowance(
                msg.sender,
                address(this)
            ) >= _amount,
            "Contract has not been approved as spender"
        );

        require(
            collateralInstance_.transferFrom(
                msg.sender,
                address(this),
                _amount
            ),
            "Transfering collateral failed"
        );
// move to constructor
        require(
            collateralInstance_.approve(
                address(cTokenInstance_),
                _amount
            ),
            "Approval for cToken failed"
        );

        assert(
            cTokenInstance_.mint(_amount) == 0
        );
        
        uint256 exchange = cTokenInstance_.exchangeRateCurrent();
        uint256 mintedTokens = _amount/exchange;

        users_[msg.sender].collateralInvested += _amount;
        users_[msg.sender].balance += mintedTokens;
        users_[msg.sender].lastDeposit = now;
        // If its a new user, last withdraw set to now
        if(users_[msg.sender].lastWtihdraw == 0) {
            users_[msg.sender].lastWtihdraw = now;
        }
        //TODO emit
    }

    function withdraw(uint256 _amount) public {
        require(
            users_[msg.sender].collateralInvested >= _amount,
            "Insufficent balance"
        );

        uint256 withdrawAllowed;
        uint256 penalty;

        (withdrawAllowed, penalty) = withdrawInstance_.calculateWithdraw(
            _amount,
            users_[msg.sender].lastWtihdraw
        );

        require(
            withdrawAllowed > 0,
            "Withdraw not allowed"
        );



        /**
        TODO 
        Exchange cDai to dai 

        send dai to user

         */

        users_[msg.sender].collateralInvested -= _amount;
    }

    function balanceOf(address _user) public view returns(uint256) {
        return users_[_user].collateralInvested;
    }

    function getUserInfo(
        address _user
    )
        public
        view
        returns(
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (
            users_[_user].collateralInvested,
            users_[_user].balance,
            users_[_user].lastDeposit,
            users_[_user].lastWtihdraw
        );
    }
}