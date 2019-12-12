pragma solidity 0.5.10;

import { WhitelistAdminRole } from "openzeppelin-solidity/contracts/access/roles/WhitelistAdminRole.sol";
import { IWithdraw } from "../interfaces/IWithdraw.sol";

contract BasicRegistry is WhitelistAdminRole {
    // Enums for the types of contracts
    enum ContractType { INVALID, WITHDRAW, PENALTY }
    // Details of a withdraw/penalty
    struct Details {
        ContractType contractType;
        address instance;
        string name;
        string implementationType;
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
        string description, 
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
     * @notice  Allows a whitelist admin to register a 
     *          deployer.
     * @param   _deployer The address of the deployer
     * @param   _deployerStatus If the deployer should be
     *          active or inactive.
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

        require(
            contractLibraries_[_withdraw].contractType == ContractType.WITHDRAW,
            "Please register withdraw utility"
        );  

        pools_[_pool].withdraw = _withdraw;
        pools_[_pool].penalty = IWithdraw(_withdraw).getPenalty();

        emit PoolRegistration(
            _admin, 
            _pool, 
            _withdraw, 
            _poolName, 
            _poolDescription
        );

        return true;
    }


    function registerUtility(
        address _admin,
        address _contract,
        string memory _name,
        string memory _description,
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
            .implementationType = _description;
        contractLibraries_[_contract]
            .active = true;

        emit UtilityRegistration(
            _admin, 
            _contract, 
            _name, 
            _description, 
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
            string memory,
            uint8,
            bool
        )
    {
        return (
            contractLibraries_[_util].name,
            contractLibraries_[_util].implementationType,
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

    //TODO add a way for the deployer to deactivate a util/pool
}