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
}

// Withdraw function the pool can call

// Store a spcific withdraw paraiter & check realtive to each user or to entire pool for parameters

// If allowed to withdraw with a penalty despite false canWithdraw() check,
// then apply the penalty by calling the PenaltyContract.Penalise(uint256 _amount)

// Irraspective of passing failing checks above, (revert if 0 with reason)
// return withdraw vaule and penality vaule


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
    function mint(uint mintAmount) external returns(uint);

    function exchangeRateCurrent() external returns(uint);

    function redeem(uint redeemTokens) external returns(uint);

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
    uint256 internal totalCollateral_;

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

        assert(
            cTokenInstance_.mint(_amount) == 0
        );

        totalCollateral_ += _amount;
        
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
                 
        emit log("Allowed withdraw amount", withdrawAmount);

        require(
            withdrawAllowed && withdrawAmount != 0,
            "Withdraw is not allowed"
        );

        uint256 totalBalance = cTokenInstance_.balanceOf(address(this));
        // totalCollateral_

        emit log("total cdai balance of pool", totalBalance);

        uint256 valuePerToken = totalBalance/totalCollateral_;
        
        emit log("value per token", valuePerToken);

        uint256 amountValue = valuePerToken*withdrawAmount;

        emit log("The vaule amount of the withdraw", amountValue);

        uint256 balanceBefore = cTokenInstance_.balanceOf(address(this));
        uint256 collateralBalanceBefore = collateralInstance_.balanceOf(address(this));

        emit log("Balance (cDai) pool", balanceBefore); 
        emit log("Balance (dai) pool", collateralBalanceBefore); 

        require(
            cTokenInstance_.redeem(amountValue) != 0,
            "Interest collateral transfer failed"
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
        totalCollateral_ -= _amount;
        users_[msg.sender].collateralInvested -= _amount;
        // users_[msg.sender].balance -= amountValue;
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
        return (
            withdrawAllowed, 
            withdrawAmount, 
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