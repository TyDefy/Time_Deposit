pragma solidity 0.5.10;

contract BasicRegistry {
    // Enums for the types of contracts
    enum ContractType { INVALID, WITHDRAW, PENALTY }
    // Details of a withdraw/penalty
    struct Details {
        ContractType contractType;
        address instance;
        string name;
        string implementationType;
    }
    // Storage of withdraw/penalty contracts
    mapping(address => Details) internal contractLibraries_;
    // Details of a pool
    struct Pool {
        address instance;
        string poolName;
        address withdraw;
        address penalty;
    }
    // Storage of a pool
    mapping(address => Pool) internal pools_;
    // Deployers
    mapping(address => bool) internal deployers_;

    constructor(address _admin) public {

    }

    function registerDeployer(address _deployer, bool _deployerStatus) public {
        deployers_[_deployer] = _deployerStatus;
    }

    function registerPool(
        address _pool,
        address _withdraw,
        address _penalty,
        string _poolName
    )
        public
        returns(bool)
    {
        require(
            pools_[_pool].instance == address(0),
            "Pre-exisiting pool. Use update"
        );

        pools_[_pool].instance = _pool;
        pools_[_pool].poolName = _poolName;

        if(_withdraw != address(0)) {
            require(
                contractLibraries_[_withdraw].contractType == ContractType.WITHDRAW,
                "Please register withdraw utility"
            );            
        }
        pools_[_pool].withdraw = _withdraw;

        if(_penalty != address(0)) {
            require(
                contractLibraries_[_withdraw].contractType == ContractType.PENALTY,
                "Please register penalty utility"
            );            
        }
        pools_[_pool].penalty = _penalty;

        return true;
    }

    function registerUtility(
        address _contract,
        string _name,
        string _implementationType,
        uint8 _type
    )
        public
        return(bool)
    {
        contractLibraries_[_contract].contractType = ContractType(_type);
        contractLibraries_[_contract].instance = _contract;
        contractLibraries_[_contract].name = _name;
        contractLibraries_[_contract].implementationType = _implementationType;
        
        return true;
    }
}