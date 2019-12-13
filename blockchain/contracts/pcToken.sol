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
    IERC20 internal collateralInstance_;

    mapping (address => mapping (address => uint256)) internal allowed;
    mapping (address => uint256) internal balances;

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
    }

    /// @notice Mints 100 000 000 free tokens to a user.
    function mint(uint mintAmount) public returns(uint) {
        uint cTokenAmount = mintAmount*exchangeRateCurrent();

        require(
            collateralInstance_.transferFrom(
                msg.sender,
                address(this),
                mintAmount
            ),
            "Transerfer failed"
        );

        totalSupply_.add(cTokenAmount);
        balances[msg.sender] = balances[msg.sender].add(cTokenAmount);
        emit Transfer(address(0), msg.sender, cTokenAmount);
        // Success 
        return 0;
    }

    function exchangeRateCurrent() public returns(uint) {
        return 10;
    }

    function redeem(uint redeemTokens) public returns (uint) {
        // require(
        //     balances[msg.sender] >= redeemTokens,
        //     "User has insuficient balance"
        // );

        uint tokenAmount = redeemTokens/exchangeRateCurrent();

        require(
            collateralInstance_.transfer(
                msg.sender,
                tokenAmount
            ),
            "Transerfer failed"
        );

        // totalSupply_.sub(redeemTokens);
        // balances[msg.sender] = balances[msg.sender].sub(redeemTokens);
        // emit Transfer(address(this), msg.sender, redeemTokens);

        // return tokenAmount;
    }

    // function exchangeRateCurrent() returns (uint) {
    //     uint getCash = collateralInstance_.balanceOf(address(this));

    //     return((getCash / totalSupply());
    // }

    /**
      * @dev Transfer token to a specified address
      * @param _to    : The address to transfer to.
      * @param _value : The amount to be transferred.
      */
    function transfer(
        address _to,
        uint256 _value
    )
        public
        returns (bool)
    {
        require(_value <= balances[msg.sender], '');
        require(_to != address(0), '');

        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    /**
      * @dev Transfer tokens from one address to another
      * @param _from     : address The address which you want to send tokens from
      * @param _to       : address The address which you want to transfer to
      * @param _value    : uint256 the amount of tokens to be transferred
      */
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    )
        public
        returns (bool)
    {
        require(_value <= balances[_from], '');
        require(_value <= allowed[_from][msg.sender], '');
        require(_to != address(0), '');

        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        emit Transfer(_from, _to, _value);
        return true;
    }

    /**
      * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
      *     Beware that changing an allowance with this method brings the risk that someone may use both the old
      *     and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
      *     race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
      *     https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
      * @param _spender  : The address which will spend the funds.
      * @param _value    : The amount of tokens to be spent.
      */
    function approve(
        address _spender,
        uint256 _value
    )
        public
        returns (bool success)
    {
        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        success = true;
    }

    /**
    ----------------------------------------------------
    view functions
    ----------------------------------------------------
    */

    /**
      * @dev Function to check the amount of tokens that an owner allowed to a spender.
      * @param _owner    : address The address which owns the funds.
      * @param _spender  : address The address which will spend the funds.
      * @return A uint256 specifying the amount of tokens still available for the spender.
      */
    function allowance(
        address _owner,
        address _spender
     )
        public
        view
        returns (uint256 remaining)
    {
        remaining = allowed[_owner][_spender];
    }

    /**
      * @return the total supply of tokens.
      */
    function totalSupply() public view returns (uint256) {
        return totalSupply_;
    }

    /**
      * @dev Gets the balance of the specified address.
      * @param _owner The address to query the the balance of.
      * @return An uint256 representing the amount owned by the passed address.
      */
    function balanceOf(address _owner) public view returns (uint256) {
        return balances[_owner];
    }
}