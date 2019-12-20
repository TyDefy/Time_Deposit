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
    // A reversable switch to stop accepting deposits
    bool internal acceptingDeposits_ = true;
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

    function closePool(
        bool _isOpen
    )
        public
        onlyWhitelistAdmin()
        killSwitch()
    {
        acceptingDeposits_ = _isOpen;
    }
    

    /**
      * @notice Allows a user to deposit raw collateral (DAI) into
      *         the contract, where it will then be converted into
      *         the interest earning asset (cDAI)
      * @param  _amount the amount of the raw token they  are depositng
      */
    function deposit(uint256 _amount) public closed() killSwitch() {
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

    event log(uint256 balance);

    function withdraw(uint256 _amount) public killSwitch() {
        require(
            users_[msg.sender].collateralInvested >= _amount,
            "Insufficent balance"
        );

        bool withdrawAllowed;
        uint256 withdrawAmount;
        uint256 penaltyAmount;

        (withdrawAllowed, withdrawAmount, penaltyAmount) = withdrawInstance_.canWithdraw(
            _amount,
            users_[msg.sender].lastWtihdraw
        );

        emit log(users_[msg.sender].balance);
        // log bal 0
        //4737129700923136780314
        //473712970092
        // ful amount of cdai
          
        if(penaltyAmount != 0) {
            // If there is a penalty, this applies it
            uint256 penaltyAmountInCdai = (
                    penaltyAmount*10**28
                )/cTokenInstance_.exchangeRateCurrent();

            if(feePercentage_ != 0) {
                // If the fee has been set up, this works it out
                uint256 fee = ((penaltyAmountInCdai*feePercentage_)/10**18);
                // Works out the fee in dai
                uint256 feeInDai = ((penaltyAmount*feePercentage_)/100);
                // Updates the admin balances with the fee
                users_[admin_].collateralInvested += feeInDai;
                users_[admin_].balance += fee;                
                // Updates the balance of the user
                users_[msg.sender].balance = users_[msg.sender].balance - fee;
                // Remove the fee from the penalty amount
                penaltyAmountInCdai = penaltyAmountInCdai - fee;
            }
            // Updates the balance of the user
            users_[msg.sender].balance = users_[msg.sender].balance - penaltyAmountInCdai;
            // Updates the balance of the penalty pot
            penaltyPot_ = penaltyPot_ + penaltyAmountInCdai;

            emit log(users_[msg.sender].balance);
            // log bal 1
            //4737129700852079834801
            // without the penalty 
        } 

        uint256 balanceBefore = collateralInstance_.balanceOf(address(this));
        uint256 balanceBeforeInCdai = cTokenInstance_.balanceOf(address(this));

        require(
            cTokenInstance_.redeemUnderlying(withdrawAmount) == 0,
            "Interest collateral transfer failed"
        );// log 2/3

        uint256 balanceAfter = collateralInstance_.balanceOf(address(this));
        uint256 balanceAfterInCdai = cTokenInstance_.balanceOf(address(this));

        uint256 cDaiBurnt = balanceBeforeInCdai - balanceAfterInCdai;
        uint256 daiRecived = balanceAfter - balanceBefore;

        totalCCollateral_ = totalCCollateral_ - cDaiBurnt;
        users_[msg.sender].collateralInvested = users_[msg.sender].collateralInvested - _amount;
        users_[msg.sender].balance = users_[msg.sender].balance - cDaiBurnt;
        users_[msg.sender].lastWtihdraw = now;

        emit log(users_[msg.sender].balance);
        // log bal 4
        //710569455067413571534
        // User balance is not 0

        require(
            collateralInstance_.transfer(
                msg.sender,
                daiRecived
            ),
            "Collateral transfer failed"
        );// log 5

        emit Withdraw(
            msg.sender,
            withdrawAmount,
            penaltyAmount
        );// log 6

        uint256 withdrawAmountInCdai = (
                    withdrawAmount*10**28
                )/cTokenInstance_.exchangeRateCurrent();//473712970092

        uint256 penaltyAmountInCdai = (
                    penaltyAmount*10**28
                )/cTokenInstance_.exchangeRateCurrent();//0

        emit Withdraw(
            msg.sender,
            withdrawAmountInCdai,
            penaltyAmountInCdai
        );// log 6

        emit Withdraw(
            msg.sender,
            daiRecived,
            cDaiBurnt
        );// log 6
    }

    function withdrawInterest() public killSwitch() {
        // uint256 penaltyRewardInCdai  = (
        //         (users_[msg.sender].balance*10**18)/totalCCollateral_
        //     )/10**18*penaltyPot_; 
            
        // uint256 interestEarnedInCdai = users_[msg.sender].balance - ((
        //         users_[msg.sender].collateralInvested*10**18
        //     )/cTokenInstance_.exchangeRateCurrent()
        // );
        // uint256 rewardInCdai = penaltyRewardInCdai + interestEarnedInCdai;

        // totalCCollateral_ -= rewardInCdai;
        // users_[msg.sender].collateralInvested -= _amount;
        // users_[msg.sender].balance -= rewardInCdai;
        // users_[msg.sender].lastWtihdraw = now;

        // uint256 balanceBefore = collateralInstance_.balanceOf(address(this));
        // uint256 balanceBeforeInCdai = cTokenInstance_.balanceOf(address(this));

        // require(
        //     cTokenInstance_.redeem(withdrawAmount) == 0,
        //     "Interest collateral transfer failed"
        // );

        // uint256 balanceAfter = collateralInstance_.balanceOf(address(this));
        // uint256 balanceAfterInCdai = cTokenInstance_.balanceOf(address(this));
        // uint256 rewardInDai = balanceAfter - balanceBefore;

        // require(
        //     collateralInstance_.transfer(
        //         msg.sender,
        //         rewardInDai
        //     ),
        //     "Collateral transfer failed"
        // );
    }

    function finalWithdraw() public killSwitch() {
        // Ensureing this can only be called once contract is killed
        require(
            !isAlive_,
            "Contract has not been terminated. Please use other withdraw"
        );
        // Withdraw full balance 
        uint256 balanceBefore = collateralInstance_.balanceOf(address(this));
        uint256 balanceBeforeInCdai = cTokenInstance_.balanceOf(address(this));
        uint256 fullUserBalance = users_[msg.sender].collateralInvested; //TODO add penalty pot portion

        require(
            cTokenInstance_.redeemUnderlying(
                fullUserBalance
            ) == 0,
            "Interest collateral transfer failed"
        );

        uint256 balanceAfter = collateralInstance_.balanceOf(address(this));
        uint256 balanceAfterInCdai = cTokenInstance_.balanceOf(address(this));
        uint256 cDaiBurnt = balanceBeforeInCdai - balanceAfterInCdai;
        uint256 daiRecived = balanceAfter - balanceBefore;
        
        totalCCollateral_ -= cDaiBurnt;
        users_[msg.sender].collateralInvested = 0;
        users_[msg.sender].balance = 0;
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
            fullUserBalance,
            0
        );
    }

    // View functions

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

    function penaltyPotBalance() public view returns(uint256) {
        return penaltyPot_;
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
}