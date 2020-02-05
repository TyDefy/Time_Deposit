pragma solidity 0.5.10;

import { WhitelistAdminRole } from "../../node_modules/openzeppelin-solidity/contracts/access/roles/WhitelistAdminRole.sol";
import { IWithdraw } from "../interfaces/IWithdraw.sol";
import { IERC20 } from "../interfaces/IERC20.sol";
import { ICToken } from "../interfaces/ICToken.sol";

contract BasicPool is WhitelistAdminRole {
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

    modifier killSwitch() {
        require(
            isAlive_,
            "This pool has been terminated"
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
        uint256 amountInDai,
        uint256 amountIncDai,
        uint256 penalty
    );
    event WithdrawInterest(
        address indexed user,
        uint256 amount
    );
    event InterestAvailable(
        address indexed user,
        uint256 amount
    );
    event PoolTerminated(
        address indexed terminator
    );
    event FeeSet(
        uint8 feePercentage
    );

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

    function init(uint8 _fee) public onlyWhitelistAdmin() {
        require(!feeLock_, "Fee has already been set");
        feePercentage_ = _fee;
        feeLock_ = true;

        emit FeeSet(
            _fee
        );
    }

    function terminatePool() public onlyWhitelistAdmin() {
        isAlive_ = false;

        emit PoolTerminated(
            msg.sender
        );
    }//4611

    /**
      * @notice Allows a user to deposit raw collateral (DAI) into
      *         the contract, where it will then be converted into
      *         the interest earning asset (cDAI)
      * @param  _amount the amount of the raw token they  are depositng
      */
    function deposit(uint256 _amount) public killSwitch() {
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

    function withdraw(uint256 _amount) public killSwitch() {
        // Ensuring the user has a suficcient balance
        require(
            users_[msg.sender].collateralInvested >= _amount,
            "Insufficent balance"
        );
        // Setting up variables to store withdraw information
        bool withdrawAllowed;
        uint256 withdrawAmount;
        uint256 penaltyAmount;
        uint256 fee = 0;

        if(address(withdrawInstance_) == address(0)) { 
            withdrawAmount = _amount;
            penaltyAmount = 0;
            withdrawAllowed = true;
        } else {
            // Getting the correct withdraw information from the withdraw contract
            (withdrawAllowed, withdrawAmount, penaltyAmount) = withdrawInstance_.canWithdraw(
                _amount,
                users_[msg.sender].lastWtihdraw
            );
            require(withdrawAllowed, "Withdraw is not allowed in violation");
            // Applying the penalty if there is one
            if(penaltyAmount != 0) {
                // If there is a penalty, this applies it
                uint256 penaltyAmountInCdai = (
                        penaltyAmount*1e28
                    )/cTokenInstance_.exchangeRateCurrent();
                // If the fee has been set up, this executes it
                if(feePercentage_ != 0) {
                    // Gets the fee amount of the penalty
                    fee = ((penaltyAmountInCdai*feePercentage_)/100);
                    // Updates the admin balances with the fee   
                    accumulativeFeeCollection_ = accumulativeFeeCollection_ + fee;
                }
                // Updates the balance of the user
                users_[msg.sender].balance = users_[msg.sender].balance - penaltyAmountInCdai;
                users_[msg.sender].collateralInvested = users_[msg.sender].collateralInvested - penaltyAmount;
                // Updates the balance of the penalty pot
                penaltyPot_ = penaltyPot_ + (penaltyAmountInCdai - fee);
                totalCCollateral_ = totalCCollateral_ - penaltyAmountInCdai;
            }
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

        totalCCollateral_ = totalCCollateral_ - cDaiBurnt;
        users_[msg.sender].collateralInvested = users_[msg.sender].collateralInvested - withdrawAmount;
        users_[msg.sender].balance = users_[msg.sender].balance - cDaiBurnt;
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
            cDaiBurnt,
            penaltyAmount
        );
    }

    function withdrawInterest() public killSwitch() {
        if(address(withdrawInstance_) != address(0)) { 
            require(
                withdrawInstance_.canWithdrawInterest(
                    users_[msg.sender].lastWtihdraw
                ),
                "Cannot withdraw interest in violation"
            );
        }
        
        // Calculating total interest available
        uint256 rewardInCdai = getInterestAmount(msg.sender);

        totalCCollateral_ = totalCCollateral_ - rewardInCdai;
        users_[msg.sender].balance = users_[msg.sender].balance - rewardInCdai;

        uint256 balanceBefore = collateralInstance_.balanceOf(address(this));

        require(
            cTokenInstance_.redeem(rewardInCdai) == 0,
            "Interest collateral transfer failed"
        );

        uint256 balanceAfter = collateralInstance_.balanceOf(address(this));
        uint256 rewardInDai = balanceAfter - balanceBefore;

        require(
            collateralInstance_.transfer(
                msg.sender,
                rewardInDai
            ),
            "Collateral transfer failed"
        );

        emit WithdrawInterest(
            msg.sender,
            rewardInDai
        );
    }

    function withdrawAndClose() public killSwitch() {
        uint256 fullUserBalance = users_[msg.sender].collateralInvested;
        // Withdraw full balance 
        withdrawInterest();
        withdraw(fullUserBalance);
    }

    function finalWithdraw() public {
        uint256 fullUserBalance = users_[msg.sender].collateralInvested;
        // Ensureing this can only be called once contract is killed
        require(
            !isAlive_,
            "Contract has not been terminated. Please use other withdraw"
        );
        // Withdraw full balance 
        withdrawInterest();
        withdraw(fullUserBalance);
    }

    // View functions

    function getInterestAmount(address _user) public returns(uint256) {
        uint256 penaltyPotShare = 0;
        uint256 interestEarnedInCdai = 0;
        // If there is a penalty pot
        if(penaltyPot_ != 0) {
            // Gets the users portion of the penalty pot
            penaltyPotShare = ((
                        (users_[_user].balance*1e18)/totalCCollateral_
                    )*penaltyPot_
                )/1e18;
        }
        // If the user has collateral with the pool
        if(users_[_user].collateralInvested != 0) {
            // Works out the interest earned
            interestEarnedInCdai = users_[_user].balance - _collateralToInterest(
                    users_[_user].collateralInvested
                );
            
            // users_[_user].balance - ((
            //         users_[_user].collateralInvested*1e28
            //     )/cTokenInstance_.exchangeRateCurrent()
            // );
        }
        // Adding the two
        uint256 availableInterest = (interestEarnedInCdai + penaltyPotShare);
        // Emits the interest for the user
        emit InterestAvailable(
            _user,
            availableInterest
        );
        // Calculating total interest available
        return availableInterest;
    }

    function getTotalBalance(address _user) public view returns(uint256) {
        uint256 penaltyPotShare = 0;

        if(penaltyPot_ != 0 && users_[_user].balance != 0) {
            // Gets the users portion of the penalty pot
            penaltyPotShare = ((
                        (users_[_user].balance*1e18)/totalCCollateral_
                    )*penaltyPot_
                )/1e18;
        }

        return (
            users_[_user].balance + penaltyPotShare
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
        if(users_[_user].collateralInvested == 0) {
            return (false, 0, 0);
        }
        if(users_[_user].collateralInvested < _amount) {
            _amount = users_[_user].collateralInvested;
        }

        bool withdrawAllowed = true;
        uint256 withdrawAmount = _amount;
        uint256 penaltyAmount = 0;
        
        if(address(withdrawInstance_) == address(0)) { 
            withdrawAmount = _amount;
            penaltyAmount = 0;
            withdrawAllowed = true;
        } else {
            (withdrawAllowed, withdrawAmount, penaltyAmount) = withdrawInstance_.canWithdraw(
                _amount,
                users_[_user].lastWtihdraw
            );
        }
         
        return (
            withdrawAllowed, 
            withdrawAmount, 
            penaltyAmount
        );
    }

    function balanceOf(address _user) public view returns(uint256) {
        return users_[_user].collateralInvested;
    }

    function penaltyPotBalance() public view returns(uint256) {
        return penaltyPot_;
    }

    function fee() public view returns(uint256) {
        return feePercentage_;
    }

    function accumulativeFee() public view returns(uint256) {
        return accumulativeFeeCollection_;
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

    function getInterestRatePerYear() public view returns(uint256) {
        return (cTokenInstance_.supplyRatePerBlock()*(60/15)*60*24*365);
    }

    function isPoolActive() public view returns(bool) {
        return isAlive_;
    }

    function getWithdrawInstance() public view returns(address) {
        return address(withdrawInstance_);
    }
    
    function _collateralToInterest(uint256 _amount) internal returns(uint256) {
        return (_amount*1e28)/cTokenInstance_.exchangeRateCurrent();
    }
}