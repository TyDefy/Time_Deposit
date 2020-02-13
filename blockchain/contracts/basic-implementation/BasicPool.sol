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
    // Instance of the collateral token (i.e Dai)
    IERC20 internal unitInstance_;
    // Instance of the interest earning token (i.e cDAI)
    ICToken internal iUnitInstance_;
    // The total amount of collateral in this pool
    uint256 internal iUnitTotalCollateral_;
    // Internal counter for penalty claim pool
    uint256 internal iUnitTotalPenaltyCollateral;
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
        uint256 unitAmount,
        uint256 iUnitAmount
    );
    event Withdraw(
        address indexed user,
        uint256 unitAmount,
        uint256 iUnitAmount,
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
        unitInstance_ = IERC20(_collateralToken);
        iUnitInstance_ = ICToken(_cToken);
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
    }

    /**
      * @notice Allows a user to deposit underlying collateral into the 
      *         contract, where it will then be converted into the interest 
      *         earning asset
      * @param  _amount the amount of the raw token they  are depositng
      */
    function deposit(uint256 _amount) public killSwitch() {
        require(
            unitInstance_.allowance(
                msg.sender,
                address(this)
            ) >= _amount,
            "Contract has not been approved as spender"
        );
        require(
            unitInstance_.transferFrom(
                msg.sender,
                address(this),
                _amount
            ),
            "Transfering collateral failed"
        );
        require(
            unitInstance_.approve(
                address(iUnitInstance_),
                _amount
            ),
            "Approval for cToken failed"
        );

        uint256 iUnitPoolBanalce = iUnitInstance_.balanceOf(address(this));

        assert(
            iUnitInstance_.mint(_amount) == 0
        );

        uint256 iUnitPoolBalanceAfter = iUnitInstance_.balanceOf(address(this));
        
        uint256 mintedTokens = iUnitPoolBalanceAfter - iUnitPoolBanalce;
        iUnitTotalCollateral_ += mintedTokens;
        iUnitTotalPenaltyCollateral += mintedTokens;

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
        uint256 fee;

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
                uint256 iUnitPenaltyAmount = _getCurrentIunitValue(penaltyAmount);
                // If the fee has been set up, this executes it
                if(feePercentage_ != 0) {
                    // Gets the fee amount of the penalty
                    fee = ((iUnitPenaltyAmount*feePercentage_)/100);
                    // Updates the admin balances with the fee   
                    accumulativeFeeCollection_ += fee;
                }
                // Updates the balance of the user
                users_[msg.sender].balance -= iUnitPenaltyAmount;
                users_[msg.sender].collateralInvested -= penaltyAmount;
                // Updates the balance of the penalty pot
                penaltyPot_ += (iUnitPenaltyAmount - fee);
                iUnitTotalCollateral_ -= (iUnitPenaltyAmount + fee);
                iUnitTotalPenaltyCollateral -= (iUnitPenaltyAmount + fee);
            }
        }

        uint256 balanceBefore = unitInstance_.balanceOf(address(this));
        uint256 iUnitBalanceBefore = iUnitInstance_.balanceOf(address(this));

        require(
            iUnitInstance_.redeemUnderlying(withdrawAmount) == 0,
            "Interest collateral transfer failed"
        );

        uint256 balanceAfter = unitInstance_.balanceOf(address(this));
        uint256 iUnitBalanceAfter = iUnitInstance_.balanceOf(address(this));
        
        uint256 iUnitBurnt = iUnitBalanceBefore - iUnitBalanceAfter; 
        uint256 unitRecived = balanceAfter - balanceBefore; 

        iUnitTotalCollateral_ -= iUnitBurnt;
        iUnitTotalPenaltyCollateral -= iUnitBurnt;
        users_[msg.sender].collateralInvested -= withdrawAmount;
        users_[msg.sender].balance -= iUnitBurnt;
        users_[msg.sender].lastWtihdraw = now;
        users_[msg.sender].totalPenaltyClaimed += withdrawAmount;

        require(
            unitInstance_.transfer(
                msg.sender,
                unitRecived
            ),
            "Collateral transfer failed"
        );

        emit Withdraw(
            msg.sender,
            withdrawAmount,
            iUnitBurnt,
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
        
        uint256 iUnitInterest; 
        uint256 penaltyPotPortion;
        (iUnitInterest, penaltyPotPortion) = _claimInterestAmount(msg.sender);
        uint256 iUnitTotalReward = iUnitInterest + penaltyPotPortion; 

        iUnitTotalCollateral_ -= iUnitTotalReward;
        iUnitTotalPenaltyCollateral -= iUnitTotalReward;
        users_[msg.sender].balance -= iUnitInterest;
        users_[msg.sender].totalPenaltyClaimed = users_[msg.sender].collateralInvested;

        uint256 balanceBefore = unitInstance_.balanceOf(address(this));

        require(
            iUnitInstance_.redeem(iUnitTotalReward) == 0,
            "Interest collateral transfer failed"
        );

        uint256 balanceAfter = unitInstance_.balanceOf(address(this));
        uint256 unitReward = balanceAfter - balanceBefore; 
        penaltyPot_ -= penaltyPotPortion;

        require(
            unitInstance_.transfer(
                msg.sender,
                unitReward
            ),
            "Collateral transfer failed"
        );

        emit WithdrawInterest(
            msg.sender,
            unitReward
        );
    }

    function withdrawAndClose() public killSwitch() {
        // Withdraw full balance 
        withdrawInterest();
        uint256 fullUserBalance = users_[msg.sender].collateralInvested;
        withdraw(fullUserBalance);
    }

    function getInternalIunitCounter() public view returns(uint256) {
        return iUnitTotalCollateral_;
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
         uint256 balanceBefore = unitInstance_.balanceOf(address(this));

        require(
            iUnitInstance_.redeem(accumulativeFeeCollection_) == 0,
            "Interest collateral transfer failed"
        );

        uint256 balanceAfter = unitInstance_.balanceOf(address(this));
        uint256 unitReward = balanceAfter - balanceBefore; 
        accumulativeFeeCollection_ = 0;

        require(
            unitInstance_.transfer(
                msg.sender,
                unitReward
            ),
            "Collateral transfer failed"
        );
    }

    /**
      * @notice Calculates interest amounts in the interest earning collateral
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
    
    /**
      * @param  _user Address of the user
      * @return uint256 The total interest and penalty reward a user has
      */
    function getUserInterest(address _user) public view returns(uint256) {
        uint256 interest = _getRoughInterestEarned(_user);
        uint256 penaltyPortion = _getPenaltyPotPortion(_user);
        return interest + penaltyPortion;
    }

    //return user's total balance (initial deposit + interest accrued + penalty pot portion)
    function getUserBalance(address _user) public view returns(uint256) {
        uint256 userInterestAndPenalty = getUserInterest(_user);
        return (users_[_user].balance + userInterestAndPenalty);
    }

    function getTotalBalance(address _user) public view returns(uint256) {
        uint256 penaltyPortion = _getPenaltyPotPortion(_user);
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
        return (iUnitInstance_.supplyRatePerBlock()*(60/15)*60*24*365);
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
      * @notice Takes in the underlying collateral value and returns the current
      *         interest earning value of that amount.
      * @dev    This only returns a rough estimation as it is not using the 
      *         current exchange rate
      * @param  _unitAmount The amount of collateral 
      * @return uint256 The amount of interest earning collateral the specified 
      *         underlying collateral is currenty worth
      */
    function _getRoughIunitValue(uint256 _unitAmount) internal view returns(uint256) {
        return (_unitAmount*1e18)/iUnitInstance_.exchangeRateStored();
    }

    /**
      * @notice Takes a interest earning value and returns the rough underlying
      *         collateral value of that amount.
      * @dev    This only returns a rough estimation as it is not using the 
      *         current exchange rate
      * @param  _iUnitAmount The amount of interest earning collateral
      * @return uint256 The current value of the interest earning collateral in
      *         the underlying collateral
      */
    function _getRoughUnitValue(uint256 _iUnitAmount) internal view returns(uint256) {
        return (_iUnitAmount*iUnitInstance_.exchangeRateStored())/1e18;
    }

    /**
      * @notice Works out the difference between the collateral invested
      *         and the current value of the interest earning collateral.
      * @param  _user The user's address 
      * @return The amount of interest in the interest earning collateral that 
      *         has accumulated
      */
    function _getRoughInterestEarned(address _user) internal view returns(uint256) {
        if(users_[_user].collateralInvested != 0) {
            // Gets the current value of the users invested balance
            uint256 currentValue = _getRoughIunitValue(
                users_[_user].collateralInvested
            );
            return users_[_user].balance - currentValue;
        } else {
            return 0;
        }
    }

    /**
      * @notice Works out how much of the penalty pot a user is entitled to
      * @param  _user Address of user
      * @return uint256 The users portion of the penalty pot
      */ 
    function _getPenaltyPotPortion(address _user) internal view returns(uint256) {
        if(penaltyPot_ != 0) {
            if(users_[_user].totalPenaltyClaimed < users_[_user].totalInvestment) {
                uint256 unclaimedPenalty = users_[_user]
                    .totalInvestment - users_[_user].totalPenaltyClaimed;
                return (((unclaimedPenalty*1e18)/iUnitTotalPenaltyCollateral
                        )*penaltyPot_
                    )/1e18;
            }
        }
        return 0;
    }

    function _claimInterestAmount(address _user) internal returns(uint256, uint256) {
        return (_getInterestEarned(_user), _claimPenaltyAmount(_user));
    }

    /**
      * @notice Works out the difference between the collateral invested
      *         and the current value of the interest earning collateral
      * @param  _user The user's address 
      * @return The amount of interest in the interest earning collateral that 
      *         has accumulated
      */
    function _getInterestEarned(address _user) internal returns(uint256) {
        if(users_[_user].collateralInvested != 0) {
            uint256 currentValue = _getCurrentIunitValue(
                users_[_user].collateralInvested
            );
            
            return users_[_user].balance - currentValue;
        } else {
            return 0;
        }
    }

    /**
      * @notice This internal function allows the interest withdraw to claim
      *         the penalty portion for the user. This prevents the user from
      *         being able to claim more of the peanlty than they are 
      *         enititled to.
      * @param  _user The address of the user
      * @return uint256 The portion of the penalty pot the user is entitled to
      */
    function _claimPenaltyAmount(address _user) internal returns(uint256) {
        // Checks the penalty pot has funds to distribute
        if(penaltyPot_ != 0) {
            // Checks the user has some unclaimed penalty amount
            if(users_[_user]
                .totalPenaltyClaimed < users_[_user].totalInvestment) 
            {
                // Calculates how much of the users balance has not already been
                // used to claim penalty
                uint256 unclaimedPenalty = users_[_user]
                    .totalInvestment - users_[_user].totalPenaltyClaimed;
                // Adds the unclaimed amount to the claimed amount
                users_[_user].totalPenaltyClaimed += unclaimedPenalty;
                // Works out the users portion of the penalty pot from their
                // unclaimed penalty portion amount
                uint256 penaltyPortion = ((
                            (unclaimedPenalty*1e18)/iUnitTotalPenaltyCollateral
                        )*penaltyPot_
                    )/1e18;
                // Removing the claimed colatteral from the balance
                iUnitTotalPenaltyCollateral -= unclaimedPenalty;
                return penaltyPortion;
            }
        }
        return 0;
    }
    
    /**
      * @notice Takes an underlying collateral value and returns the current 
      *         interest earning collateral value of that
      *         amount.
      * @param  _unitAmount The amount of underlying collateral
      * @return uint256 The amount of interest earning collateral the specified
      *         amount is currenty worth
      */
    function _getCurrentIunitValue(
        uint256 _unitAmount
    )
        internal
        returns(uint256) 
    {
        return (_unitAmount*1e18)/iUnitInstance_.exchangeRateCurrent();
    }

    /**
      * @notice Takes an interest earning collateral value and returns the 
      *         current underlying collateral value of that amount.
      * @param  _iUnitAmount The amount of interest earning collateral
      * @return uint256 The current value of the interest earning collateral in 
      *         underlying collateral
      */
    function _getCurrentUnitValue(uint256 _iUnitAmount) internal returns(uint256) {
        return (_iUnitAmount*iUnitInstance_.exchangeRateCurrent())/1e18;
    }

    /**
      * @notice Adds the current earned interest to the balance of the user.
      * @dev    Allows the withdraw function to "reset" interest earned into 
      *         the collateral   
      * @param  _user The address of the user
      */
    function _addInterestToBalance(address _user) internal {
        uint256 interestEarned = _getInterestEarned(_user);
        uint256 unitInterest = _getCurrentUnitValue(interestEarned);
        
        users_[msg.sender].collateralInvested = users_[msg.sender].collateralInvested + unitInterest;
    }
}