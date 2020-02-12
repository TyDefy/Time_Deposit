pragma solidity 0.5.10;

import { WhitelistAdminRole } from "openzeppelin-solidity/contracts/access/roles/WhitelistAdminRole.sol";
import { IWithdraw } from "../interfaces/IWithdraw.sol";

/**
  * @author Veronica Coutts (@veronicaLC)
  * @title  Basic registry
  * @notice The registry for the econtract ecosystem. This registry allows for
  *         multiple factories (registered deployers) and accomidated multiple
  *         contract types, so long as they conform to the defined interfaces.
  */
contract BasicRegistry is WhitelistAdminRole {
    // Enums for the types of contracts
    enum ContractType { INVALID, CYCLIC_WITHDRAW, ROLLING_WITHDRAW, PENALTY }
    // Details of a withdraw/penalty
    struct Details {
        ContractType contractType;
        address instance;
        string name;
        bool active;
    }
    // Storage of withdraw/penalty contracts
    mapping(address => Details) internal contractLibraries_;
    // Details of a pool
    struct Pool {
        address instance;
        string poolName;
        address withdraw;
        address penalty;
        bool active;
    }
    // Storage of a pool
    mapping(address => Pool) internal pools_;
    // Deployers
    mapping(address => bool) internal deployers_;

    event PoolRegistration(
        address indexed admin, 
        address indexed pool, 
        address indexed withdraw, 
        string name, 
        string description
    );
    event UtilityRegistration(
        address indexed admin, 
        address indexed utility, 
        string name, 
        uint8 typeOfUtil
    );

    constructor(
        address _admin
    )
        public
    {
        addWhitelistAdmin(_admin);
    }

    modifier onlyDeployer() {
        require(
            deployers_[msg.sender],
            "Access denied, sender not a regsitered deployer"
        );
        _;
    }

    /**
     * @notice  Allows a whitelist admin to register a deployer.
     * @param   _deployer The address of the deployer
     * @param   _deployerStatus If the deployer should be active or inactive.
     */
    function registerDeployer(
        address _deployer,
        bool _deployerStatus
    )
        public
        onlyWhitelistAdmin()
    {
        deployers_[_deployer] = _deployerStatus;
    }

    /**
      * @notice This allows a registered deployer to register a deployed pool.
      * @param  _admin The address of the admin
      * @param  _pool The address of the pool
      * @param  _withdraw The address of the withdraw library. Note: This can be
      *         a 0 address if the pool was deployed without a withdraw library
      * @param  _poolName The name of the pool
      * @param  _poolDescription The description of the pool
      * @return bool If the pool was successfully registered
      */
    function registerPool(
        address _admin,
        address _pool,
        address _withdraw,
        string memory _poolName,
        string memory _poolDescription
    )
        public
        onlyDeployer()
        returns(bool)
    {
        require(
            pools_[_pool].instance == address(0),
            "Pre-exisiting pool. Use update"
        );

        pools_[_pool].instance = _pool;
        pools_[_pool].poolName = _poolName;
        pools_[_pool].active = true;

        if(_withdraw != address(0)) {
            require(
                contractLibraries_[_withdraw].contractType == ContractType.CYCLIC_WITHDRAW ||
                contractLibraries_[_withdraw].contractType == ContractType.ROLLING_WITHDRAW,
                "Please register withdraw utility"
            );

            pools_[_pool].withdraw = _withdraw;
            pools_[_pool].penalty = IWithdraw(_withdraw).getPenalty();
        } else {
            pools_[_pool].withdraw = _withdraw;
            pools_[_pool].penalty = address(0);
        }

        emit PoolRegistration(
            _admin, 
            _pool, 
            _withdraw, 
            _poolName, 
            _poolDescription
        );

        return true;
    }


    /**
      * @notice Allows a registered deployer to register a deployed utility
      * @param  _admin The address of the admin (user who deployed)
      * @param  _contract The address of the utility (penalty/cyclic/rolling)
      * @param  _name The name for the utility
      * @param  _type The type of utility being registered (please see the 
      *         ContractType enum for utility types)
      * @return bool If the utility was successfully registered.
      */
    function registerUtility(
        address _admin,
        address _contract,
        string memory _name,
        uint8 _type
    )
        public
        onlyDeployer()
        returns(bool)
    {
        contractLibraries_[_contract]
            .contractType = ContractType(_type);
        contractLibraries_[_contract]
            .instance = _contract;
        contractLibraries_[_contract]
            .name = _name;
        contractLibraries_[_contract]
            .active = true;

        emit UtilityRegistration(
            _admin, 
            _contract, 
            _name, 
            _type
        );

        return true;
    }

    /**
      * @notice Gets the details of a utility
      * @param  _util The address of the util
      * @return string The name
      * @return string The implementation type
      * @return uint8 The type of util
      * @return bool The active state of the util 
      */    
    function utilityDetails(
        address _util
    )
        public
        view 
        returns(
            string memory,
            uint8,
            bool
        )
    {
        return (
            contractLibraries_[_util].name,
            uint8(contractLibraries_[_util].contractType),
            contractLibraries_[_util].active
        );
    }

    /**
      * @notice Returns the details of a pool
      * @param  _pool The address of the pool 
      * @return string The name of the pool
      * @return address The address of the withdraw util
      * @return address The address of the penalty util
      * @return bool The active state of the pool
      */
    function poolDetails(
        address _pool
    )
        public
        view
        returns(
            string memory,
            address,
            address,
            bool
        )
    {
        return(
            pools_[_pool].poolName,
            pools_[_pool].withdraw,
            pools_[_pool].penalty,
            pools_[_pool].active
        );
    }
}