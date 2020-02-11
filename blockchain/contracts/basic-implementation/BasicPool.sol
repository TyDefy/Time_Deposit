pragma solidity 0.5.10;

import { WhitelistAdminRole } from "openzeppelin-solidity/contracts/access/roles/WhitelistAdminRole.sol";
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
        uint256 totalPenaltyClaimed;    // underlying interest earning
        uint256 totalInvestment;        // underlying interest earning
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
        users_[msg.sender].totalInvestment += mintedTokens;
        // If its a new user, last withdraw set to now
        if(users_[msg.sender].lastWtihdraw == 0) {
            users_[msg.sender].lastWtihdraw = now;
            users_[msg.sender].totalPenaltyClaimed = 0;
        }
        
        emit Deposit(
            msg.sender,
            _amount,
            mintedTokens
        );
    }

    function withdraw(uint256 _amount) public killSwitch() {
        // Adding any earned interest into the balance of the user
        _addInterestToBalance(msg.sender);
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
                uint256 penaltyAmountInCdai = _getCurrentCdaiValue(penaltyAmount);
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
        users_[msg.sender].totalPenaltyClaimed += withdrawAmount;

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
        
        uint256 interestInCdai;
        uint256 penaltyPotPortion;
        (interestInCdai, penaltyPotPortion) = _claimInterestAmount(msg.sender);
        uint256 totalRewardInCdai = interestInCdai + penaltyPotPortion;

        totalCCollateral_ = totalCCollateral_ - totalRewardInCdai;
        users_[msg.sender].balance = users_[msg.sender].balance - interestInCdai;
        users_[msg.sender].totalPenaltyClaimed = users_[msg.sender].collateralInvested;

        uint256 balanceBefore = collateralInstance_.balanceOf(address(this));

        require(
            cTokenInstance_.redeem(totalRewardInCdai) == 0,
            "Interest collateral transfer failed"
        );

        uint256 balanceAfter = collateralInstance_.balanceOf(address(this));
        uint256 rewardInDai = balanceAfter - balanceBefore;
        penaltyPot_ -= penaltyPotPortion;

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
        // Withdraw full balance 
        withdrawInterest();
        uint256 fullUserBalance = users_[msg.sender].collateralInvested;
        withdraw(fullUserBalance);
    }

    function finalWithdraw() public {
        // Ensureing this can only be called once contract is killed
        require(
            !isAlive_,
            "Contract has not been terminated. Please use other withdraw"
        );
        // Withdraw full balance 
        withdrawInterest();
        uint256 fullUserBalance = users_[msg.sender].collateralInvested;
        withdraw(fullUserBalance);
    }

    function withdrawAdminFee() public onlyWhitelistAdmin() {
         uint256 balanceBefore = collateralInstance_.balanceOf(address(this));

        require(
            cTokenInstance_.redeem(accumulativeFeeCollection_) == 0,
            "Interest collateral transfer failed"
        );

        uint256 balanceAfter = collateralInstance_.balanceOf(address(this));
        uint256 rewardInDai = balanceAfter - balanceBefore;
        accumulativeFeeCollection_ = 0;

        require(
            collateralInstance_.transfer(
                msg.sender,
                rewardInDai
            ),
            "Collateral transfer failed"
        );
    }

    /**
      * @notice Calculates interest amounts in cDai
      * @param  _user The address of the user
      * @return uint256 The amount of interest earned
      * @return uint256 The portion of the penalty pool the user is entitled to
      */
    function getInterestAmount(address _user) public returns(uint256, uint256) {
        emit InterestAvailable(
            _user,
            (_getInterestEarned(_user) + _getPenaltyPotPortion(_user))
        );
        return (_getInterestEarned(_user), _getPenaltyPotPortion(_user));
    }

    function _claimInterestAmount(address _user) internal returns(uint256, uint256) {
        return (_getInterestEarned(_user), _claimPenaltyAmount(_user));
    }
    
    /**
      * @param  _user Address of the user
      * @return uint256 The total interest and penalty reward a user has
      */
    function getUserInterest(address _user) public view returns(uint256) {
        uint256 interest = _getRoughInterestEarned(_user);
        uint256 penaltyPortion = _getPenaltyPotPortion(_user);
        return interest + penaltyPortion;
    }

    //return user's total balance (initial deposit + interest accrued + penalty pot portion) in DAI/cDAI
    function getUserBalance(address _user) public view returns(uint256) {
        uint256 userInterestAndPenalty = getUserInterest(_user);
        return (users_[_user].balance + userInterestAndPenalty);
    }

    function getTotalBalance(address _user) public view returns(uint256) {
        uint256 penaltyPortion = yes(_user);
        return (users_[_user].balance + penaltyPortion);
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

    /**
      * ------------------------------------------------------------------------
      * INTERNAL FUNCTIONS
      * ------------------------------------------------------------------------
      */

    /**
      * @notice Works out the difference between the collateral invested
      *         and the current value of the cDai.
      * @param  _user The user's address 
      * @return The amount of interest in cDai that has accumulated
      */
    function _getInterestEarned(address _user) internal returns(uint256) {
        if(users_[_user].collateralInvested != 0) {
            uint256 currentValue = _getCurrentCdaiValue(
                users_[_user].collateralInvested
            );
            
            return users_[_user].balance - currentValue;
        } else {
            return 0;
        }
    }

    /**
      * @notice Works out the users portion of the penalty pot
      * @param  _user Address of user
      * @return uint256 The users portion of the penalty pot
      */ 
    function _getPenaltyPotPortion(address _user) internal view returns(uint256) {
        if(penaltyPot_ != 0) {
            if(users_[_user].totalPenaltyClaimed < users_[_user].totalInvestment) {
                uint256 unclaimedPenalty = users_[_user]
                    .totalInvestment - users_[_user].totalPenaltyClaimed;
                return (((unclaimedPenalty*1e18)/totalCCollateral_
                        )*penaltyPot_
                    )/1e18;
            }
        }
        return 0;
    }

    function _claimPenaltyAmount(address _user) internal returns(uint256) {
        if(penaltyPot_ != 0) {
            if(users_[_user].totalPenaltyClaimed < users_[_user].totalInvestment) {
                uint256 unclaimedPenalty = users_[_user]
                    .totalInvestment - users_[_user].totalPenaltyClaimed;
                users_[_user].totalPenaltyClaimed += unclaimedPenalty;
                return (((unclaimedPenalty*1e18)/totalCCollateral_
                        )*penaltyPot_
                    )/1e18;
            }
        }
        return 0;
    }
    
    /**
      * @notice Takes a Dai value and returns the current cDai value of that
      *         amount.
      * @param  _amountInDai The amount of dai
      * @return uint256 The amount of cDai the Dai is currenty worth
      */
    function _getCurrentCdaiValue(uint256 _amountInDai) internal returns(uint256) {
        // Dai in cDai out
        return (_amountInDai*1e18)/cTokenInstance_.exchangeRateCurrent();
    }

    /**
      * @notice Takes a cDai value and returns the current Dai value of that amount.
      * @param  _amountInCdai The amount in cDai
      * @return uint256 The current value of the cDai in Dai
      */
    function _getCurrentDaiValue(uint256 _amountInCdai) internal returns(uint256) {
        // cDai in Dai out
        return (_amountInCdai*cTokenInstance_.exchangeRateCurrent())/1e18;
    }

    /**
      * @notice Adds the current earned interest to the balance of the user.
      * @dev    Allows the withdraw function to "reset" interest earned into 
      *         the collateral   
      * @param  _user The address of the user
      */
    function _addInterestToBalance(address _user) internal {
        uint256 interestEarned = _getInterestEarned(_user);
        uint256 interestInDai = _getCurrentDaiValue(interestEarned);
        
        users_[msg.sender].collateralInvested = users_[msg.sender].collateralInvested + interestInDai;
    } 

    /**
      * @notice Takes a Dai value and returns the current cDai value of that
      *         amount.
      * @dev    This only returns a rough estimation as it is not using the current exchange rate
      * @param  _amountInDai The amount of dai
      * @return uint256 The amount of cDai the Dai is currenty worth
      */
    function _getRoughCdaiValue(uint256 _amountInDai) internal view returns(uint256) {
        // Dai in cDai out
        return (_amountInDai*1e18)/cTokenInstance_.exchangeRateStored();
    }

    /**
      * @notice Takes a cDai value and returns the rough Dai value of that amount.
      * @dev    This only returns a rough estimation as it is not using the current exchange rate
      * @param  _amountInCdai The amount in cDai
      * @return uint256 The current value of the cDai in Dai
      */
    function _getRoughDaiValue(uint256 _amountInCdai) internal view returns(uint256) {
        // cDai in Dai out
        return (_amountInCdai*cTokenInstance_.exchangeRateStored())/1e18;
    }

    /**
      * @notice Works out the difference between the collateral invested
      *         and the current value of the cDai.
      * @param  _user The user's address 
      * @return The amount of interest in cDai that has accumulated
      */
    function _getRoughInterestEarned(address _user) internal view returns(uint256) {
        if(users_[_user].collateralInvested != 0) {
            uint256 currentValue = _getRoughCdaiValue(
                users_[_user].collateralInvested
            );
            
            return users_[_user].balance - currentValue;
        } else {
            return 0;
        }
    }
}