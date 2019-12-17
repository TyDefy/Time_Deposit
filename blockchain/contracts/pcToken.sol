pragma solidity 0.5.10;

import { ERC20 } from "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { ICToken } from "./interfaces/ICToken.sol";
import { IERC20 } from "./interfaces/IERC20.sol";

/**
  * @notice THIS CONTRACT IS FOR TESTING PORPOSES ONLY!!
  *         This contract is a mock of the cToken interface, and exists
  *         so that the contracts can be fully tested.
  */
contract pcToken is ICToken, ERC20 {
    using SafeMath for uint256;
    // using SafeMath for uint8;
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 internal totalSupply_;
    uint256 internal totalReserves_;
    uint256 internal totalBorrows_;
    IERC20 internal collateralInstance_;

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 value
    );

    constructor(
        string memory _name, 
        string memory _symbol, 
        uint8 _decimals, 
        address _colalteral
    ) 
        public 
    {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        collateralInstance_ = IERC20(_colalteral);
        totalSupply_ = 57733536549738757;
        totalReserves_ = 125573360914251726089975;
        totalBorrows_ = 2867271208090219596939682;
    }

    function mint(uint mintAmount) public returns(uint) {
        uint newCdai = (mintAmount*10**28)/exchangeRateCurrent();
        _mint(msg.sender, newCdai);
        require(
            collateralInstance_.transferFrom(
                msg.sender, 
                address(this), 
                mintAmount
            ),
            "Transfer failed"
        );

        return 0;
    }

    function redeem(uint redeemTokens) public returns (uint) {
        // Working out how much Dai the redeemed tokens are worth
        uint tokenValueInDai = (redeemTokens*exchangeRateCurrent())/10**28 + 1;
        _burn(msg.sender, redeemTokens);

        require(
            collateralInstance_.transfer(
                msg.sender,
                tokenValueInDai
            ),
            "Transerfer failed"
        );

        return 0;
    }

    function redeemUnderlying(uint redeemAmount) public returns(uint) {
        uint256 cRedeemAmount = (redeemAmount*10**28)/exchangeRateCurrent();
        _burn(msg.sender, cRedeemAmount);
        require(
            collateralInstance_.transfer(
                msg.sender,
                redeemAmount
            ),
            "Transerfer failed"
        );
        
        return 0;
    }

    function getCash() public view returns(uint) {
        return 9445753245515894173386887;
    }

    function exchangeRateCurrent() public returns(uint) {
        return 211098294354306448527248519;
        // return (getCash() + totalBorrows() - totalReserves_) / totalSupply();
    }
}
