pragma solidity 0.5.10;

import { WhitelistAdminRole } from "openzeppelin-solidity/contracts/access/roles/WhitelistAdminRole.sol";
import { IWithdraw } from "../interfaces/IWithdraw.sol";
import { IERC20 } from "../interfaces/IERC20.sol";
import { ICToken } from "../interfaces/ICToken.sol";

contract BasicPool is WhitelistAdminRole {
    // Address that will recive fee
    address internal admin_;
    // The fee as a percentage of the penality %
    uint256 internal feePercentage_ = 0;
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
    // 
    bool internal acceptingDeposits_;

    // struct of all user withdraw information
    struct UserInfo {
        uint256 collateralInvested;
        uint256 balance;
        uint256 lastDeposit;
        uint256 lastWtihdraw;
    }
    // A mapping of all active suers
    mapping(address => UserInfo) internal users_;

    modifier mutex() {
        require(
            lock_,
            "Contract locked, please try again"
        );
        lock_ = false;
        _;
        lock_ = true;
    }

    modifier closed() {
        require(
            acceptingDeposits_,
            "This pool is no longer accepting deposits"
        );
        _;
    }

    event Deposit(
        address indexed user,
        uint256 amountInCollateral,
        uint256 amountInInterestEarning
    );
    event Withdraw(
        address indexed user,
        uint256 amount,
        uint256 penalty
    );
    event WithdrawInterest();

    constructor(
        address _admin,
        address _withdraw,
        address _collateralToken,
        address _cToken
    )
        public
    {
        addWhitelistAdmin(_admin);
        withdrawInstance_ = IWithdraw(_withdraw);
        collateralInstance_ = IERC20(_collateralToken);
        cTokenInstance_ = ICToken(_cToken);
    }

    function init(uint256 _fee) public onlyWhitelistAdmin() {
        feePercentage_ = _fee;
    }

    function closePool(bool _isOpen) public onlyWhitelistAdmin() {
        acceptingDeposits_ = _isOpen;
    }
    

    /**
      * @notice Allows a user to deposit raw collateral (DAI) into
      *         the contract, where it will then be converted into
      *         the interest earning asset (cDAI)
      * @param  _amount the amount of the raw token they  are depositng
      */
    function deposit(uint256 _amount) public closed() {
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
        
        emit Deposit(
            msg.sender,
            _amount,
            mintedTokens
        );
    }

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
          
        if(penaltyAmount != 0) {
            // If there is a penalty, this applies it
            uint256 penaltyAmountInCdai = (
                    penaltyAmount*10**18
                )/cTokenInstance_.exchangeRateCurrent();
            if(feePercentage_ != 0) {
                // If the fee has been set up, this works it out
                uint256 fee = ((penaltyAmountInCdai*feePercentage_)/100);
                // Removes the fee from the penalty amount
                penaltyAmountInCdai = penaltyAmountInCdai - fee;
                // Works out the fee in dai
                uint256 feeInDai = ((penaltyAmount*feePercentage_)/100);
                // Updates the admin balances with the fee
                users_[admin_].collateralInvested -= feeInDai;
                users_[admin_].balance -= fee;
            }
            // Updates the balance of the penalty pot
            penaltyPot_ += penaltyAmountInCdai;
            // Updates the balance of the user
            users_[msg.sender].balance -= penaltyAmountInCdai;
        } 

        uint256 balanceBefore = collateralInstance_.balanceOf(address(this));
        uint256 balanceBeforeInCdai = cTokenInstance_.balanceOf(address(this));

        require(
            cTokenInstance_.redeemUnderlying(withdrawAmount) == 0,
            "Interest collateral transfer failed"
        );

        uint256 balanceAfter = collateralInstance_.balanceOf(address(this));
        uint256 balanceAfterInCdai = cTokenInstance_.balanceOf(address(this));

        uint256 cDaiBurnt = balanceBeforeInCdai - balanceAfterInCdai;
        uint256 daiRecived = balanceAfter - balanceBefore;

        totalCCollateral_ -= cDaiBurnt;
        users_[msg.sender].collateralInvested -= _amount;
        users_[msg.sender].balance -= cDaiBurnt;
        users_[msg.sender].lastWtihdraw = now;

        require(
            collateralInstance_.transfer(
                msg.sender,
                daiRecived
            ),
            "Collateral transfer failed"
        );

        emit Withdraw(
            msg.sender,
            withdrawAmount,
            penaltyAmount
        );
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
            
        return (
            withdrawAllowed, 
            withdrawAmount, 
            penaltyAmount
        );
    }

    function withdrawInterest() public {
        // uint256 penaltyRewardInCdai  = ((users_[msg.sender].balance*10**18)/totalCCollateral_
        //     )/10**18*penaltyPot_; 

        // uint256 penaltyPotReward = (
        //         (users_[msg.sender].balance*10**18)/totalCCollateral_
        //     )/10**18*penaltyPot_;
            
        // uint256 interestEarned = users_[msg.sender].balance - ((
        //         users_[msg.sender].collateralInvested*10**18
        //     )/cTokenInstance_.exchangeRateCurrent()
        // );
        // uint256 reward = penaltyPotReward + interestEarned;
    }

    function getInterestAmount(address _user) public returns(uint256) {
        uint256 penaltyPotReward = (
                (users_[_user].balance*10**18)/totalCCollateral_
            )/10**18*penaltyPot_;
            
        uint256 interestEarned = users_[_user].balance - ((
                users_[_user].collateralInvested*10**18
            )/cTokenInstance_.exchangeRateCurrent()
        );
        return penaltyPotReward + interestEarned;
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