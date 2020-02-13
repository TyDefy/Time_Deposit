pragma solidity 0.5.10;

import { BasicRegistry } from "./BasicRegistry.sol";
import { BasicPool } from "./BasicPool.sol";
import { CyclicWithdraw } from "./CyclicWithdraw.sol";
import { RollingWithdraw } from "./RollingWithdraw.sol";
import { IWithdraw } from "../interfaces/IWithdraw.sol";
import { BasicPenalty } from "./BasicPenalty.sol";
import { WhitelistAdminRole } from "openzeppelin-solidity/contracts/access/roles/WhitelistAdminRole.sol";

/**
  * @author Veronica Coutts (@VeronicaLC)
  * @title  Basic Factory
  * @notice This is the factory for the basic pool. This factory is designed
  *         following the hub and spoke method. The factory will register all 
  *         deployed pools and utilities with the registry, in order to enable
  *         the hub and spoke upgradablity pattern.
  */
contract BasicFactory is WhitelistAdminRole {
    address internal collateral_;
    string internal collateralSymbol_;
    address internal interestToken_;
    string internal tokenSymbol_;
    BasicRegistry internal registryInstance_;

    event DeployedUtilities(
        address indexed withdraw,
        uint8 _cycleLength,
        string _withdrawName,
        address indexed penalty,
        uint8 _penaltyRate,
        string _penaltyName,
        bool _canWithdrawInViolation,
        bool _canWithdrawInterestInViolation
    );
    event DeployedPool(
        address indexed pool,
        address indexed withdraw,
        uint8 penaltyPercentage,
        string name,
        string description,
        uint8 cycleLength,
        string tokenSymbol,
        bool canWithdrawInViolation,
        bool canWithdrawInterestInViolation
    );

    /**
      * @param  _admin The address of the admin for this factory
      * @param  _registry The address of the registery contract
      * @param  _collateral The address of the underlying collateral
      * @param  _collateralSymbol The symbol for the underlying collateral
      * @param  _interestToken The address for the interest earning collateral
      * @param  _tokenSymbol The symbol for the inerest earning collateral
      */
    constructor(
        address _admin,
        address _registry,
        address _collateral,
        string memory _collateralSymbol,
        address _interestToken,
        string memory _tokenSymbol
    )
        public
    {
        addWhitelistAdmin(_admin);

        collateral_ = _collateral;
        collateralSymbol_ = _collateralSymbol;

        interestToken_ = _interestToken;
        tokenSymbol_ = _tokenSymbol;

        registryInstance_ = BasicRegistry(_registry);

        //TODO remove msg.sender from admin
    }

    /**
      * @notice Allows an admin to deploy a basic pool
      * @param  _withdraw The address of the withdraw library to be used. Note:
      *         this can be a 0 address should the pool not need the withdraw
      *         library.
      * @param  _poolName The name of the pool
      * @param  _poolDescription A description of the pool
      * @return The address of the deployed pool
      */
    function deployBasicPool(
        address _withdraw,
        string memory _poolName,
        string memory _poolDescription
    )
        public
        onlyWhitelistAdmin()
        returns(address)
    {
        BasicPool newPool = new BasicPool(
            msg.sender,
            _withdraw,
            collateral_,
            interestToken_
        );

        require(
            registryInstance_.registerPool(
                msg.sender,
                address(newPool),
                _withdraw,
                _poolName,
                _poolDescription
            ),
            "Pool registration falied"
        );

        uint8 cycleLength = 0;
        address penaltyInstance = address(0);
        uint8 penaltyPercentage = 0;
        bool canWithdrawInterestInViolation = true;
        bool canWithdrawInViolation = true;

        if(_withdraw != address(0)) {
            cycleLength = IWithdraw(_withdraw).getCycle();
            penaltyInstance = IWithdraw(_withdraw).getPenalty();
            penaltyPercentage = BasicPenalty(penaltyInstance).penalty();
            canWithdrawInterestInViolation = IWithdraw(_withdraw).canWithdrawInterestInViolation();
            canWithdrawInViolation = IWithdraw(_withdraw).canWithdrawInViolation();
        }

        emit DeployedPool(
            address(newPool), 
            _withdraw, 
            penaltyPercentage,
            _poolName, 
            _poolDescription, 
            cycleLength,
            tokenSymbol_,
            canWithdrawInterestInViolation,
            canWithdrawInViolation
        );

        return(address(newPool));
    }

    /**
      * @notice Allows an admin to deploy a utility pair. This pair consists of
      *         a withdraw library and a penalty library
      * @param  _penaltyPercentage The percentage (as a whole number) the 
      *         penalty will be. Note: The penalty must be within th 1 - 99 
      *         range
      * @param  _cycleLength The length (in months) of the cyclic withdraw.
      *         Note: If this is 0 a rolling withdraw library will be deployed
      *         instead of the cyclic
      * @param  _canWithdrawInViolation This switch (if true) allows a user to 
      *         withdraw their funds in violation (of the cycle or rolling), and
      *         have the penalty applied. 
      *         If false, a user will be blocked from withdrawing in violation.
      *         Note: If this is set to false in a rolling withdraw the user
      *         will never be able to withdraw their underlying investment.
      * @param  _canWithdrawInterestInViolation Much like the above switch, this
      *         switch will do the same blocking action in violation but for any
      *         interest earned.
      * @param  _penaltyName The name the penalty library should be called
      * @param  _withdrawName The name the withdraw library should be called
      * @return address The address of the withdraw library
      * @return address The address of the penalty library
      */
    function deployUtility(
        uint8 _penaltyPercentage,
        uint8 _cycleLength,
        bool _canWithdrawInViolation,
        bool _canWithdrawInterestInViolation,
        string memory _penaltyName,
        string memory _withdrawName
    )
        public
        onlyWhitelistAdmin()
        returns(address, address)
    {
        require(
            _penaltyPercentage > 0 && _penaltyPercentage < 100,
            "Penalty invalid"
        );

        BasicPenalty newPenalty = new BasicPenalty(
            _penaltyPercentage
        );

        IWithdraw newWithdraw;

        if(_cycleLength == 0) {
            RollingWithdraw newRollingWithdraw = new RollingWithdraw(
                address(newPenalty),
                _cycleLength,
                _canWithdrawInViolation,
                _canWithdrawInterestInViolation
            );
            newWithdraw = IWithdraw(newRollingWithdraw);

            require(
                registryInstance_.registerUtility(
                    msg.sender,
                    address(newWithdraw),
                    _withdrawName,
                2
                ),
                "Penalty registration failed"
            );
        } else {
            CyclicWithdraw newCyclicWithdraw = new CyclicWithdraw(
                address(newPenalty),
                _cycleLength,
                _canWithdrawInViolation,
                _canWithdrawInterestInViolation
            );
            newWithdraw = IWithdraw(newCyclicWithdraw);

            require(
                registryInstance_.registerUtility(
                    msg.sender,
                    address(newWithdraw),
                    _withdrawName,
                    1
                ),
                "Penalty registration failed"
            );
        }

        require(
            registryInstance_.registerUtility(
                msg.sender,
                address(newPenalty),
                _penaltyName,
                3
            ),
            "Penalty registration failed"
        );

        emit DeployedUtilities(
            address(newWithdraw),
            _cycleLength,
            _withdrawName,
            address(newPenalty),
            _penaltyPercentage,
            _penaltyName,
            _canWithdrawInViolation,
            _canWithdrawInterestInViolation
        );

        return(
            address(newWithdraw),
            address(newPenalty)
        );
    }
}