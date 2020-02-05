pragma solidity 0.5.10;

import { WhitelistAdminRole } from "../../node_modules/openzeppelin-solidity/contracts/access/roles/WhitelistAdminRole.sol";
import { IWithdraw } from "../interfaces/IWithdraw.sol";
import { IERC20 } from "../interfaces/IERC20.sol";
import { ICToken } from "../interfaces/ICToken.sol";

contract Pool is WhitelistAdminRole {
    // Tracks fee collection
    uint256 internal accumulativeFeeCollection_;
    // The fee as a percentage of the penality %
    uint8 internal feePercentage_ = 0;
    // Lock for setting the fee
    bool internal feeLock_ = false;
    // Instance of the withdraw library
    IWithdraw internal withdrawInstance_;
    // Instance of the collateral token (DAI) that this
    IERC20 internal collateralInstance_;
    // Instance of the interest earning token (cDAI)
    ICToken internal cTokenInstance_;
    // The total amount of collateral in this pool
    uint256 internal totalCCollateral_;
    // The amount of cToken allocated to the penalty pool
    uint256 internal penaltyPot_;
    // A non-reversable switch to kill the contract
    bool internal isAlive_ = true;

    // struct of all user withdraw information
    struct UserInfo {
        uint256 collateralInvested;
        uint256 balance;
        uint256 lastDeposit;
        uint256 lastWtihdraw;
    }
    // A mapping of all active suers
    mapping(address => UserInfo) internal users_;

    constructor(
        address _admin,
        address _withdraw,
        address _collateralToken,
        address _cToken
    )
        public
    {
        // addWhitelistAdmin(_admin);
        withdrawInstance_ = IWithdraw(_withdraw);
        collateralInstance_ = IERC20(_collateralToken);
        cTokenInstance_ = ICToken(_cToken);
    }

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
    }
    
    function withdraw(uint256 _amount) public {
        _resetInvestment(msg.sender);
        _getCurrentInvestmentValue(_amount);
    }
    
    uint256 public currentValue;
    uint256 public differenceInInvestment;
    uint256 public value;
    
    function _resetInvestment(address _user) internal returns(uint256) {
         currentValue = _getCurrentInvestmentValue(
                users_[_user].collateralInvested
            );
         differenceInInvestment = users_[_user].balance - currentValue;
    }
    
    function _getCurrentInvestmentValue(uint256 _amountInCdai) internal returns(uint256) {
        value = (_amountInCdai*1e18)/cTokenInstance_.exchangeRateCurrent();
        return value;
    }
    
    function _getCurrentCollateralValue(uint256 _amountInDai) internal returns(uint256) {
        value = (_amountInDai*1e28)/cTokenInstance_.exchangeRateCurrent();
        return value;
    }
    
    /**
    User cDai:      461 099 542 959
    Current value:  461 099 503 600
    461099967578
     */
    
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