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
    // Mutex variable
    bool internal lock_;
    // The total amount of collateral in this pool
    uint256 internal totalCCollateral_;
    // The amount of cToken allocated to the penalty pool
    uint256 internal penaltyPot_;

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

    modifier mutex() {
        require(
            lock_,
            "Contract locked, please try again"
        );
        lock_ = false;
        _;
        lock_ = true;
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

        uint256 poolCTokenBalance = cTokenInstance_.balanceOf(address(this));

        assert(
            cTokenInstance_.mint(_amount) == 0
        );

        uint256 poolCTokenBalanceAfter = cTokenInstance_.balanceOf(address(this));
        
        uint256 mintedTokens = poolCTokenBalanceAfter - poolCTokenBalance;
        totalCCollateral_ += mintedTokens;

        users_[msg.sender].collateralInvested += _amount;
        users_[msg.sender].balance += mintedTokens;
        users_[msg.sender].lastDeposit = now;
        // If its a new user, last withdraw set to now
        if(users_[msg.sender].lastWtihdraw == 0) {
            users_[msg.sender].lastWtihdraw = now;
        }
        //TODO emit
    }

    event log(string _msg, uint256 _number);

    function withdraw(uint256 _amount) public {
        require(
            users_[msg.sender].collateralInvested >= _amount,
            "Insufficent balance"
        );

        bool withdrawAllowed;
        uint256 withdrawAmount;
        uint256 penaltyAmount;

        (withdrawAllowed, withdrawAmount, penaltyAmount) = canWithdraw(
            msg.sender,
            _amount
        );

        uint256 payoutAmount  = withdrawAmount + (
                (users_[msg.sender].balance*10**18)/totalCCollateral_
            )/10**18*penaltyPot_;

        penaltyPot_ += penaltyAmount;
                 
        emit log("Payout amount", payoutAmount);

        // require(
        //     withdrawAllowed && withdrawAmount != 0,
        //     "Withdraw is not allowed"
        // );

        /**
        1 000 000 000 000 000 000 000
          950 000 000 000 000 000 000
          15
         */

        // uint256 totalBalance = cTokenInstance_.balanceOf(address(this));
        // // totalCollateral_

        // emit log("total cdai balance of pool", totalBalance);

        // uint256 valuePerToken = totalBalance/totalCollateral_;
        
        // emit log("value per token", valuePerToken);

        // uint256 amountValue = valuePerToken*withdrawAmount;

        // emit log("The vaule amount of the withdraw", amountValue);

        // uint256 balanceBefore = cTokenInstance_.balanceOf(address(this));
        // uint256 collateralBalanceBefore = collateralInstance_.balanceOf(address(this));
        // uint256 balanceofctoken = collateralInstance_.balanceOf(address(cTokenInstance_));

        // emit log("Balance (cDai) pool", balanceBefore); 
        // emit log("Balance (dai) pool", collateralBalanceBefore); 
        // emit log("Balance of cToken in dai", balanceofctoken); 

        /**
        1000000000000000000000
        1000000000000000000000
        500000000000000000000
         */

        // require(
        //     cTokenInstance_.approve(
        //         address(cTokenInstance_),
        //         amountValue
        //     ),
        //     "Approve failed"
        // );
        uint256 balanceBefore = collateralInstance_.balanceOf(address(this));
        // require(
            cTokenInstance_.redeem(payoutAmount); //!= 0,
            // "Interest collateral transfer failed"
        // );
        uint256 balanceAfter = collateralInstance_.balanceOf(address(this));

        collateralInstance_.transfer(
                msg.sender,
                balanceAfter - balanceBefore
            );

        // uint256 balanceAfter = cTokenInstance_.balanceOf(address(this));
        // uint256 collateralBalanceAfter = collateralInstance_.balanceOf(address(this));

        // emit log("Balance after redeem (cDai) pool", balanceAfter); 
        // emit log("Balance after redeem (dai) pool", collateralBalanceAfter); 

        // assert(
        //     balanceBefore - amountValue == balanceAfter
        // );

        // uint256 collateral = collateralBalanceAfter - collateralBalanceBefore;

        // emit log("Collateral difference", collateral);

        // require(
        //     collateralInstance_.transfer(
        //         msg.sender,
        //         collateral
        //     ),
        //     "Collateral transfer failed"
        // );

        // require(
        //     withdrawAllowed > 0,
        //     "Withdraw not allowed"
        // );



        // /**
        // TODO 
        // Exchange cDai to dai 

        // send dai to user

        //  */
        totalCCollateral_ -= _amount;
        users_[msg.sender].collateralInvested -= _amount;
        users_[msg.sender].balance -= payoutAmount + penaltyAmount;
        users_[msg.sender].lastWtihdraw = now;
    }

    function canWithdraw(
        address _user,
        uint256 _amount
    )
        public
        view
        returns(
            bool, 
            uint256, 
            uint256
        ) 
    {
        bool withdrawAllowed = true;
        uint256 withdrawAmount = _amount;
        uint256 penaltyAmount = 0;
        (withdrawAllowed, withdrawAmount, penaltyAmount) = withdrawInstance_.canWithdraw(
            _amount,
            users_[_user].lastWtihdraw
        );

        uint256 payoutAmount = withdrawAmount + (
                (users_[msg.sender].balance*10**18)/totalCCollateral_
            )/10**18*penaltyPot_;
            
        return (
            withdrawAllowed, 
            payoutAmount, 
            penaltyAmount
        );
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