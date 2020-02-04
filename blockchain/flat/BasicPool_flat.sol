pragma solidity 0.5.10;

contract IWithdraw {

    /**
      * @notice Emitted when the withdraw function is called.
      */
    event withdrawCalculated(
        address indexed _user,
        uint256 _withdrawAmount,
        uint256 _penaltyAmount
    );

    /**
      * @notice Allows the pool (and user) to check if they are able to 
      *         wtihdraw. If the withdraw contract does not allow for 
      *         withdrawing inside of penalty, this function will return false
      *         inside penalty.
      * @param  _amount The amount the user wants to withdraw
	  * @param	_lastWithdraw The time stamp from the last withdraw
      * @return bool If the user can withdraw (false if they cannot)
      * @return uint256 If the user can withdraw, this is how much they will get
      *         _amount - penalty.
      * @return uint256 If the user can withdraw and there is a penalty, this is
      *         the penalty.
      */
    function canWithdraw(
        uint256 _amount,
		uint256 _lastWithdraw
    )
		public
		view
		returns(bool, uint256, uint256);

    function canWithdrawInterest(uint256 _lastWithdraw) public view returns(bool);

    /**
      * @notice Tells the pool how much a user can withdraw. Emits the 
      *         withdrawCalculated event.
      * @return uint256 The amount the user can withdraw
      * @return uint256 The amount of penalty (0 if there is non)
      * @return uint256 The timestamp of the last withdraw
      * @dev    This function will revert if a user cannot withdraw
      *         during the penalty. 
      */
    function calculateWithdraw(
        uint256 _amount,
        uint256 _lastWithdraw
    )
        public
		view
        returns(uint256, uint256);

	  function getPenalty() public view returns(address);

    function cantWithdrawInViolation() public view returns(bool);

    function cantWithdrawInterestInViolation() public view returns(bool);

    function getCycle() public view returns(uint8);
}


/**
 * @dev Interface of the ERC20 standard as defined in the EIP. Does not include
 * the optional functions; to access them see {ERC20Detailed}.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

interface ICToken {
    function mint(uint mintAmount) external returns (uint);

    function exchangeRateCurrent() external returns (uint);

    function redeem(uint redeemTokens) external returns (uint);
    
    function redeemUnderlying(uint redeemAmount) external returns (uint);

    function supplyRatePerBlock() external view returns (uint);

    // Standard ERC20 functionality 

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);
 
    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}


/**
 * @title Roles
 * @dev Library for managing addresses assigned to a Role.
 */
library Roles {
    struct Role {
        mapping (address => bool) bearer;
    }

    /**
     * @dev Give an account access to this role.
     */
    function add(Role storage role, address account) internal {
        require(!has(role, account), "Roles: account already has role");
        role.bearer[account] = true;
    }

    /**
     * @dev Remove an account's access to this role.
     */
    function remove(Role storage role, address account) internal {
        require(has(role, account), "Roles: account does not have role");
        role.bearer[account] = false;
    }

    /**
     * @dev Check if an account has this role.
     * @return bool
     */
    function has(Role storage role, address account) internal view returns (bool) {
        require(account != address(0), "Roles: account is the zero address");
        return role.bearer[account];
    }
}


/**
 * @title WhitelistAdminRole
 * @dev WhitelistAdmins are responsible for assigning and removing Whitelisted accounts.
 */
contract WhitelistAdminRole {
    using Roles for Roles.Role;

    event WhitelistAdminAdded(address indexed account);
    event WhitelistAdminRemoved(address indexed account);

    Roles.Role private _whitelistAdmins;

    constructor () internal {
        _addWhitelistAdmin(msg.sender);
    }

    modifier onlyWhitelistAdmin() {
        require(isWhitelistAdmin(msg.sender), "WhitelistAdminRole: caller does not have the WhitelistAdmin role");
        _;
    }

    function isWhitelistAdmin(address account) public view returns (bool) {
        return _whitelistAdmins.has(account);
    }

    function addWhitelistAdmin(address account) public onlyWhitelistAdmin {
        _addWhitelistAdmin(account);
    }

    function renounceWhitelistAdmin() public {
        _removeWhitelistAdmin(msg.sender);
    }

    function _addWhitelistAdmin(address account) internal {
        _whitelistAdmins.add(account);
        emit WhitelistAdminAdded(account);
    }

    function _removeWhitelistAdmin(address account) internal {
        _whitelistAdmins.remove(account);
        emit WhitelistAdminRemoved(account);
    }
}





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
    }

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
            interestEarnedInCdai = users_[_user].balance - ((
                    users_[_user].collateralInvested*1e28
                )/cTokenInstance_.exchangeRateCurrent()
            );
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
}