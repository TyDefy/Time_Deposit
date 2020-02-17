pragma solidity 0.5.10;

import { WhitelistAdminRole } from "openzeppelin-solidity/contracts/access/roles/WhitelistAdminRole.sol";
import { IWithdraw } from "../interfaces/IWithdraw.sol";
import { IERC20 } from "../interfaces/IERC20.sol";
import { ICToken } from "../interfaces/ICToken.sol";

/**
  * @author Veronica Coutts (@VeronicaLC)
  * @title  Basic Pool
  * @notice This basic pool allows for a collective savings account. This pool
  *         is intended as a comitment mechanism for savings, and to form the 
  *         base for future itterations
  */
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

    /**
      * @param  _admin The address of the admin for this pool
      * @param  _withdraw The address of the withdraw contract. This can be a 
      *         0 address, and will not break the pool
      * @param  _collateralToken The address of the unit (collateral token)
      * @param  _cToken The address of the iunit (the interest earning token)
      */
    constructor(
        address _admin,
        address _withdraw,
        address _collateralToken,
        address _cToken
    )
        public
    {
        withdrawInstance_ = IWithdraw(_withdraw);
        unitInstance_ = IERC20(_collateralToken);
        iUnitInstance_ = ICToken(_cToken);
        addWhitelistAdmin(_admin);
    }

    function removeFacotryAsAdmin() public onlyWhitelistAdmin() {
        renounceWhitelistAdmin();
    }

    /**
      * @notice This function allows admins to set the fee for the pool. This 
      *         fee can only be set once, and cannot be edited. This fee is 
      *         taken off as a percentage of any penalties
      * @dev    If no fee is set the contracts will still work
      * @param  _fee The fee that will be applied to any penalties
      */
    function init(uint8 _fee) public onlyWhitelistAdmin() {
        require(!feeLock_, "Fee has already been set");
        feePercentage_ = _fee;
        feeLock_ = true;

        emit FeeSet(
            _fee
        );
    }

    /**
      * @notice Allows an admin to terminate the pool. Terminating the pool will
      *         prevent any new deoposits, as well as blocking all withdraws. 
      *         There is a specific withdraw (finalWithdraw) that will only be 
      *         accessible after the pool has been terminated
      */
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

    /**
      * @notice This call will add any unclaimed interest to the users balance. 
      *         This added interest does not include any penalty
      * @param  _amount The amount the user would like to withdraw 
      */
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
            // Getting the correct withdraw information from the withdraw lib
            (
                withdrawAllowed, 
                withdrawAmount, 
                penaltyAmount
            ) = withdrawInstance_.canWithdraw(
                _amount,
                users_[msg.sender].lastWtihdraw
            );
            require(withdrawAllowed, "Withdraw is not allowed in violation");
            // Applying the penalty if there is one
            if(penaltyAmount != 0) {
                // If there is a penalty, this applies it
                uint256 iUnitPenAmount = _getCurrentIunitValue(penaltyAmount);
                // If the fee has been set up, this executes it
                if(feePercentage_ != 0) {
                    // Gets the fee amount of the penalty
                    fee = ((iUnitPenAmount*feePercentage_)/100);
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

    /**
      * @notice Allows a user to withdraw their interest and penalty pot share
      */
    function withdrawInterest() public killSwitch() {
        if(address(withdrawInstance_) != address(0)) { 
            require(
                withdrawInstance_.canWithdrawInterest(
                    users_[msg.sender].lastWtihdraw
                ),
                "Cannot withdraw interest in violation"
            );
        }
        // Gets the users interest as well as claiming their portion of the
        // penalty pot
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

    /**
      * @notice Allows a user to withdraw all the funds from their account
      */
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

        _addInterestToBalance(msg.sender);

        // Withdraw full balance 
        uint256 iUnitInterest; 
        uint256 penaltyPotPortion;
        (iUnitInterest, penaltyPotPortion) = _claimInterestAmount(msg.sender);
        uint256 iUnitTotalReward = iUnitInterest + penaltyPotPortion;

        require(
            iUnitInterest == 0,
            "User interest has not been added"
        ); 

        iUnitTotalCollateral_ -= iUnitTotalReward;
        users_[msg.sender].balance -= iUnitInterest;
        users_[msg.sender].totalPenaltyClaimed = users_[msg.sender]
            .collateralInvested;

        uint256 balanceBeforeInterest = unitInstance_.balanceOf(address(this));

        require(
            iUnitInstance_.redeem(iUnitTotalReward) == 0,
            "Interest collateral transfer failed"
        );

        uint256 balanceAfterInterest = unitInstance_.balanceOf(address(this));
        uint256 unitReward = balanceAfterInterest - balanceBeforeInterest; 
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

        uint256 withdrawAmount = users_[msg.sender].collateralInvested;
        uint256 penaltyAmount;
        uint256 fee;

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

    /**
      * @notice Allows an admin to withdraw the accumulated admin fee.
      */
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
      * ------------------------------------------------------------------------
      * VIEW FUNCTIONS
      * ------------------------------------------------------------------------
      */

    /**
      * @notice Calculates interest amounts in the interest earning collateral
      * @param  _user The address of the user
      * @return uint256 The amount of interest earned
      * @return uint256 The portion of the penalty pool the user is entitled to
      */
    function getInterestAmount(
        address _user
    )
        public
        view
        returns(uint256, uint256) 
    {
        return (
            _getRoughInterestEarned(_user), 
            _getPenaltyPotPortion(_user)
        );
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

    /**
      * @param  _user The address of the user
      * @return uint256 The total balance of the user and any interest or 
      *         penalty they are entitled to. This value is in units (interest
      *         earning collateral)
      */
    function getUserBalance(address _user) public view returns(uint256) {
        uint256 userInterestAndPenalty = getUserInterest(_user);
        return (users_[_user].balance + userInterestAndPenalty);
    }

    /**
      * @param  _user The address of the user
      * @param  _amount The amount of collateral (uints) the user wishes to 
      *         withdraw
      * @return bool If the pool allows users to withdraw collateral at this 
      *         time (may be blocked in a cyclic withdraw)
      * @return uint256 The amount the user can withdraw
      * @return uint256 The penalty amount that will be charged if they withdraw
      *         at this time
      */
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
            (
                withdrawAllowed, 
                withdrawAmount, 
                penaltyAmount
            ) = withdrawInstance_.canWithdraw(
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

    /**
      * @param  _user The address of the user
      * @return uint256 The balance (in units) of the user
      */
    function balanceOf(address _user) public view returns(uint256) {
        return users_[_user].collateralInvested;
    }

    /**
      * @return uint256 The collected balance of the penalty pot, to be 
      *         distributed between token holders within the pool.
      */
    function penaltyPotBalance() public view returns(uint256) {
        return penaltyPot_;
    }

    /**
      * @notice The fee is taken off as a percentage of the penalty
      * @return uint256 The whole number percentage fee that is taken off
      */
    function fee() public view returns(uint256) {
        return feePercentage_;
    }

    /**
      * @return uint256 The total amount of interest earning collateral the fee 
      *         has accumulated
      */
    function accumulativeFee() public view returns(uint256) {
        return accumulativeFeeCollection_;
    }

    /**
      * @notice Returns the relavant user info
      * @param  _user The address of the user
      * @return uint256 The users collateral invested balance in units
      * @return uint256 The users interest earning collateral balance in iunits
      * @return uint256 The time stamp from the users last deposit
      * @return uint256 The time stamp from the users last wtihdraw
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

    /**
      * @return Returns the active status of the pool
      */
    function isPoolActive() public view returns(bool) {
        return isAlive_;
    }

    /**
      * @return Returns the address of the withdraw instance
      */
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
    function _getRoughIunitValue(
        uint256 _unitAmount
    )
        internal
        view
        returns(uint256) 
    {
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
    function _getRoughUnitValue(
        uint256 _iUnitAmount
    )
        internal
        view
        returns(uint256)
    {
        return (_iUnitAmount*iUnitInstance_.exchangeRateStored())/1e18;
    }

    /**
      * @notice Works out the difference between the collateral invested
      *         and the current value of the interest earning collateral.
      * @param  _user The user's address 
      * @return The amount of interest in the interest earning collateral that 
      *         has accumulated
      */
    function _getRoughInterestEarned(
        address _user
    )
        internal
        view
        returns(uint256)
    {
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
    function _getPenaltyPotPortion(
        address _user
    ) 
        internal 
        view 
        returns(uint256) 
    {
        if(penaltyPot_ != 0) {
            if(users_[_user].totalPenaltyClaimed < users_[_user]
                    .totalInvestment
            ) {
                uint256 unclaimedPenalty = users_[_user]
                    .totalInvestment - users_[_user].totalPenaltyClaimed;
                return (((unclaimedPenalty*1e18)/iUnitTotalPenaltyCollateral
                        )*penaltyPot_
                    )/1e18;
            }
        }
        return 0;
    }

    /**
      * @notice Internally used to get interest amount and claim penalty amount
      * @dev    This needed to be a seporate function in order to accomidate
      *         the _claimPenaltyAmount. This was needed to keep internal 
      *         counters correct.
      * @param  _user The address of the user
      * @return uint256 The amount of interest a user has earned
      * @return uint256 The portion of the penalty pot the user is entitled to
      */
    function _claimInterestAmount(
        address _user
    )
        internal
        returns(uint256, uint256) 
    {
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
    function _getCurrentUnitValue(
        uint256 _iUnitAmount
    )  
        internal 
        returns(uint256) 
    {
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
        
        users_[msg.sender].collateralInvested += unitInterest;
    }
}